from fastapi import FastAPI, UploadFile, Form, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from typing import Optional
import pyodbc
import base64
import io
import os

from app import db, vqa_model
from app.text_to_image import generate_image, image_to_base64, record_download
from app.models import TextToImageRequest, TextToImageResponse
from app.db import (
    get_recent_generated_images,
    get_generated_image_by_id,
    search_generated_images,
    increment_view_count,
    get_generation_statistics,
    delete_generated_image,
    add_prompt_tag,
    get_tags_for_image,
    get_images_by_seed
)

app = FastAPI()

# CORS middleware
origins = [
    "http://localhost:3000",  # React frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Direct connection parameters
DB_SERVER = r"(localdb)\MSSQLLocalDB"
DB_DATABASE = "VQA_DB"

try:
    conn = pyodbc.connect(
        f'DRIVER={{ODBC Driver 17 for SQL Server}};'
        f'SERVER={DB_SERVER};'
        f'DATABASE={DB_DATABASE};'
        f'Trusted_Connection=yes;'
    )
    print("[SUCCESS] Connected to SQL Server successfully!")
    cursor = conn.cursor()
except pyodbc.Error as e:
    conn = None
    print("[ERROR] Failed to connect to SQL Server")
    print(e)

# =============================================================================
# VQA ENDPOINTS
# =============================================================================

@app.post("/vqa/")
async def vqa(image: UploadFile, question: str = Form(...)):
    """
    Visual Question Answering endpoint.
    Accepts an image and a question, returns an AI-generated answer.
    """
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    try:
        image_id = db.insert_image(image.filename, img_bytes)

        def generate_answer_fn():
            return vqa_model.ask_vqa(img, question)

        question_id, answer, confidence, existed = db.get_or_create_answer(
            image_id, question, generate_answer_fn
        )

    except Exception as e:
        print(f"[ERROR] DB error: {e}")
        answer = "Error occurred"
        confidence = 0.0
        existed = False

    return {
        "answer": answer,
        "confidence": confidence,
        "from_cache": existed
    }


@app.get("/images/")
async def get_images():
    """
    Fetch all VQA images with their question statistics.
    """
    try:
        cursor.execute("""
            SELECT i.ImageID, i.FileName, i.FilePath
            FROM Images i
        """)
        rows = cursor.fetchall()

        images = []
        for image_id, filename, filepath in rows:
            # Read image bytes from disk
            if os.path.exists(filepath):
                with open(filepath, "rb") as f:
                    img_bytes = f.read()
                encoded_image = base64.b64encode(img_bytes).decode("utf-8")
            else:
                print(f"[WARNING] File not found: {filepath}")
                encoded_image = None

            # Count questions for this image
            cursor.execute("""
                SELECT COUNT(*) 
                FROM Questions 
                WHERE ImageID = ?
            """, image_id)
            questions_count = cursor.fetchone()[0]

            images.append({
                "image_id": image_id,
                "filename": filename,
                "questions_count": questions_count,
                "image_data": f"data:image/jpeg;base64,{encoded_image}" if encoded_image else None
            })

        return JSONResponse(content=images)
    except Exception as e:
        print(f"[ERROR] DB error: {e}")
        return JSONResponse(content=[], status_code=500)


@app.get("/images/{image_id}/questions/")
async def get_image_questions(image_id: int):
    """
    Fetch questions & answers for a single image.
    """
    try:
        cursor.execute("""
            SELECT q.QuestionID, q.QuestionText, a.AnswerText
            FROM Questions q
            LEFT JOIN Answers a ON q.QuestionID = a.QuestionID
            WHERE q.ImageID = ?
        """, image_id)
        rows = cursor.fetchall()
        result = [
            {"question_id": qid, "question": qt, "answer": ans or ""}
            for qid, qt, ans in rows
        ]
        return result
    except Exception as e:
        print(f"[ERROR] DB error: {e}")
        return []


# =============================================================================
# TEXT-TO-IMAGE ENDPOINTS
# =============================================================================

@app.post("/text-to-image/", response_model=TextToImageResponse)
async def text_to_image_endpoint(request: TextToImageRequest):
    """
    Generate an image from a text prompt using Stable Diffusion.
    Saves the image to disk and stores metadata in the database.
    """
    try:
        print(f"[INFO] Received text-to-image request: {request.prompt[:50]}...")
        
        # Generate image (will automatically save to DB)
        image, seed, file_path, db_id = generate_image(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            width=request.width,
            height=request.height,
            seed=request.seed,
            save_to_db=True  # Always save to database
        )
        
        # Convert to base64 for response
        image_data = image_to_base64(image)
        
        print(f"[SUCCESS] Image generated with DB ID: {db_id}")
        
        return TextToImageResponse(
            image_data=image_data,
            seed=seed,
            prompt=request.prompt,
            file_path=file_path,
            db_id=db_id  # Include database ID in response
        )
        
    except Exception as e:
        print(f"[ERROR] Text-to-image generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/generated-images/")
async def get_generated_images(
    limit: int = Query(50, ge=1, le=100, description="Number of images to return")
):
    """
    Fetch recent generated images from the database.
    Images are loaded from disk based on file paths stored in DB.
    """
    try:
        # Get recent images from database
        images_data = get_recent_generated_images(limit=limit)
        
        result = []
        for img_data in images_data:
            file_path = img_data['file_path']
            
            # Read image from disk
            if os.path.exists(file_path):
                try:
                    with open(file_path, "rb") as f:
                        img_bytes = f.read()
                    encoded_image = base64.b64encode(img_bytes).decode("utf-8")
                    
                    result.append({
                        "generated_image_id": img_data['generated_image_id'],
                        "filename": img_data['file_name'],
                        "image_data": f"data:image/png;base64,{encoded_image}",
                        "prompt": img_data['prompt'],
                        "negative_prompt": img_data.get('negative_prompt', ''),
                        "seed": img_data['seed'],
                        "width": img_data['image_width'],
                        "height": img_data['image_height'],
                        "created_at": img_data['generation_time'].isoformat() if img_data['generation_time'] else None,
                        "view_count": img_data['view_count'],
                        "download_count": img_data['download_count']
                    })
                except Exception as e:
                    print(f"[WARNING] Could not load image {file_path}: {e}")
            else:
                print(f"[WARNING] File not found: {file_path}")
        
        return result
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch generated images: {e}")
        return JSONResponse(content=[], status_code=500)


@app.get("/generated-images/{image_id}")
async def get_generated_image_details(image_id: int):
    """
    Get detailed information about a specific generated image.
    """
    try:
        # Get image data from database
        img_data = get_generated_image_by_id(image_id)
        
        if not img_data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Increment view count
        increment_view_count(image_id)
        
        # Load image from disk
        file_path = img_data['file_path']
        image_data = None
        
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                img_bytes = f.read()
            encoded_image = base64.b64encode(img_bytes).decode("utf-8")
            image_data = f"data:image/png;base64,{encoded_image}"
        
        # Get tags for this image
        tags = get_tags_for_image(image_id)
        
        return {
            "generated_image_id": img_data['generated_image_id'],
            "prompt": img_data['prompt'],
            "negative_prompt": img_data['negative_prompt'],
            "image_data": image_data,
            "seed": img_data['seed'],
            "num_inference_steps": img_data['num_inference_steps'],
            "guidance_scale": img_data['guidance_scale'],
            "width": img_data['image_width'],
            "height": img_data['image_height'],
            "generation_time": img_data['generation_time'].isoformat() if img_data['generation_time'] else None,
            "generation_duration": img_data['generation_duration'],
            "model_used": img_data['model_used'],
            "view_count": img_data['view_count'],
            "download_count": img_data['download_count'],
            "file_size": img_data['file_size'],
            "tags": tags
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to get image details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generated-images/{image_id}/download")
async def record_image_download(image_id: int):
    """
    Record that an image was downloaded.
    """
    try:
        success = record_download(image_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return {"message": "Download recorded", "image_id": image_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to record download: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/generated-images/search/")
async def search_images(
    q: str = Query(..., min_length=1, description="Search term for prompts")
):
    """
    Search generated images by prompt text.
    """
    try:
        images_data = search_generated_images(q)
        
        result = []
        for img_data in images_data:
            file_path = img_data['file_path']
            
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    img_bytes = f.read()
                encoded_image = base64.b64encode(img_bytes).decode("utf-8")
                
                result.append({
                    "generated_image_id": img_data['generated_image_id'],
                    "filename": img_data['file_name'],
                    "image_data": f"data:image/png;base64,{encoded_image}",
                    "prompt": img_data['prompt'],
                    "seed": img_data['seed'],
                    "created_at": img_data['generation_time'].isoformat() if img_data['generation_time'] else None
                })
        
        return result
        
    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        return JSONResponse(content=[], status_code=500)


@app.get("/generated-images/seed/{seed}")
async def get_images_by_seed_endpoint(seed: int):
    """
    Get all images generated with a specific seed.
    """
    try:
        images_data = get_images_by_seed(seed)
        
        result = []
        for img_data in images_data:
            file_path = img_data['file_path']
            
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    img_bytes = f.read()
                encoded_image = base64.b64encode(img_bytes).decode("utf-8")
                
                result.append({
                    "generated_image_id": img_data['generated_image_id'],
                    "filename": img_data['file_name'],
                    "image_data": f"data:image/png;base64,{encoded_image}",
                    "prompt": img_data['prompt'],
                    "seed": img_data['seed'],
                    "width": img_data['image_width'],
                    "height": img_data['image_height'],
                    "created_at": img_data['generation_time'].isoformat() if img_data['generation_time'] else None
                })
        
        return result
        
    except Exception as e:
        print(f"[ERROR] Failed to get images by seed: {e}")
        return JSONResponse(content=[], status_code=500)


@app.delete("/generated-images/{image_id}")
async def delete_image(
    image_id: int,
    delete_file: bool = Query(False, description="Also delete the physical file")
):
    """
    Delete a generated image from the database and optionally from disk.
    """
    try:
        success = delete_generated_image(image_id, delete_file=delete_file)
        
        if not success:
            raise HTTPException(status_code=404, detail="Image not found or could not be deleted")
        
        return {"message": "Image deleted successfully", "image_id": image_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to delete image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/generation-statistics/")
async def get_statistics():
    """
    Get overall statistics about image generation.
    """
    try:
        stats = get_generation_statistics()
        
        # Convert bytes to MB for readability
        if 'total_storage_bytes' in stats:
            stats['total_storage_mb'] = round(stats['total_storage_bytes'] / (1024 * 1024), 2)
        
        return stats
        
    except Exception as e:
        print(f"[ERROR] Failed to get statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generated-images/{image_id}/tags")
async def add_tag_to_image(image_id: int, tag: str = Query(..., min_length=1)):
    """
    Add a tag to a generated image.
    """
    try:
        success = add_prompt_tag(image_id, tag)
        
        if not success:
            raise HTTPException(status_code=400, detail="Could not add tag")
        
        return {"message": "Tag added successfully", "image_id": image_id, "tag": tag}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to add tag: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/generated-images/{image_id}/tags")
async def get_image_tags(image_id: int):
    """
    Get all tags for a specific image.
    """
    try:
        tags = get_tags_for_image(image_id)
        return {"image_id": image_id, "tags": tags}
        
    except Exception as e:
        print(f"[ERROR] Failed to get tags: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/")
async def root():
    """
    API health check endpoint.
    """
    return {
        "status": "online",
        "message": "VisionFusion AI API",
        "endpoints": {
            "vqa": "/vqa/",
            "images": "/images/",
            "text_to_image": "/text-to-image/",
            "generated_images": "/generated-images/",
            "statistics": "/generation-statistics/"
        }
    }