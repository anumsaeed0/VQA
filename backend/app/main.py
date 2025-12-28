from fastapi import FastAPI, UploadFile, Form
from PIL import Image
import io
import os

from app import db, vqa_model
from fastapi.middleware.cors import CORSMiddleware
import pyodbc

from fastapi.responses import JSONResponse
import base64
from . import db

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
    print("[Success] Connected to SQL Server successfully!")
    cursor = conn.cursor()
except pyodbc.Error as e:
    conn = None
    print("[Error] Failed to connect to SQL Server")
    print(e)

@app.post("/vqa/")
async def vqa(image: UploadFile, question: str = Form(...)):
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
        print("[Error] DB error:", e)
        answer = "Error occurred"
        confidence = 0.0
        existed = False

    return {
        "answer": answer,
        "confidence": confidence,
        "from_cache": existed
    }

# @app.post("/vqa/")
# async def vqa(image: UploadFile, question: str = Form(...)):
#     # Read image
#     img_bytes = await image.read()
#     img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

#     # Get answer from LLaVA
#     answer, confidence = vqa_model.ask_vqa(img, question)

#     # Optional: store in DB if connection exists
#     try:
#         image_id = db.insert_image(image.filename, img_bytes)
#         question_id = db.insert_question(image_id, question)
#         db.insert_answer(question_id, answer, confidence)
#     except Exception as e:
#         print("[Error] DB error:", e)

#     return {
#         "answer": answer,
#         "confidence": confidence
#     }

# Fetch all images with question stats
@app.get("/images/")
async def get_images():
    try:
        cursor.execute("""
            SELECT ImageID, FileName, FilePath
            FROM Images
        """)
        rows = cursor.fetchall()

        images = []
        for image_id, filename, filepath in rows:
            if os.path.exists(filepath):
                with open(filepath, "rb") as f:
                    img_bytes = f.read()
                encoded_image = base64.b64encode(img_bytes).decode("utf-8")
                images.append({
                    "image_id": image_id,
                    "filename": filename,
                    "image_data": f"data:image/jpeg;base64,{encoded_image}"
                })
            else:
                print(f"[Warning] File not found: {filepath}")

        return JSONResponse(content=images)
    except Exception as e:
        print("[Error] DB error:", e)
        return JSONResponse(content=[], status_code=500)

# @app.get("/images/")
# async def get_images():
#     try:
#         cursor.execute("""
#             SELECT i.ImageID, i.FileName, i.FileData, 
#                    COUNT(q.QuestionID) as questions_count
#             FROM Images i
#             LEFT JOIN Questions q ON i.ImageID = q.ImageID
#             GROUP BY i.ImageID, i.FileName, i.FileData
#         """)
#         rows = cursor.fetchall()

#         images = []
#         for row in rows:
#             image_id, filename, filedata, questions_count = row
#             encoded_image = base64.b64encode(filedata).decode("utf-8")
#             images.append({
#                 "image_id": image_id,
#                 "filename": filename,
#                 "questions_count": questions_count,
#                 "image_data": f"data:image/jpeg;base64,{encoded_image}"
#             })

#         return JSONResponse(content=images)
#     except Exception as e:
#         print("[Error] DB error:", e)
#         return JSONResponse(content=[], status_code=500)

# Fetch questions & answers for a single image
@app.get("/images/{image_id}/questions/")
async def get_image_questions(image_id: int):
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
        print("[Error] DB error:", e)
        return []
