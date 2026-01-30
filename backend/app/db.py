import pyodbc
import os
from datetime import datetime
from typing import Optional, Tuple, List, Dict

# Direct connection parameters
DB_SERVER = r"(localdb)\MSSQLLocalDB"
DB_DATABASE = "VQA_DB"
UPLOAD_DIR = r"C:\Users\ADMIN\Downloads\multimodal_lab\VQA\uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# -----------------------------
# Establish database connection
# -----------------------------
try:
    conn = pyodbc.connect(
        f'DRIVER={{ODBC Driver 17 for SQL Server}};'
        f'SERVER={DB_SERVER};'
        f'DATABASE={DB_DATABASE};'
        f'Trusted_Connection=yes;'
    )
    print("✅ Connected to SQL Server successfully!")
    cursor = conn.cursor()
except pyodbc.Error as e:
    conn = None
    print("❌ Failed to connect to SQL Server")
    print(e)

# -----------------------------
# Insert an image and return ImageID
# -----------------------------
def insert_image(filename: str, filedata: bytes) -> int:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(filedata)

    cursor.execute("SELECT ImageID FROM Images WHERE FileName = ?", filename)
    row = cursor.fetchone()
    if row:
        print("[Info] Image already exists, reusing ImageID")
        return row[0]

    sql = """
    INSERT INTO Images (FileName, FilePath, UploadTime)
    OUTPUT INSERTED.ImageID
    VALUES (?, ?, GETDATE())
    """
    cursor.execute(sql, filename, file_path)
    image_id = cursor.fetchone()[0]
    if image_id is None:
        raise ValueError("Failed to get ImageID after insert")
    conn.commit()
    return image_id

# def insert_image(filename: str, filedata: bytes) -> int:
#     # Check if image already exists
#     cursor.execute("SELECT ImageID FROM Images WHERE FileName = ?", filename)
#     row = cursor.fetchone()
#     if row:
#         print("[Error] Image already exists, reusing ImageID")
#         return row[0]

#     # Insert new image and get ID
#     sql = """
#     INSERT INTO Images (FileName, FileData)
#     OUTPUT INSERTED.ImageID
#     VALUES (?, ?)
#     """
#     cursor.execute(sql, filename, filedata)
#     image_id = cursor.fetchone()[0]
#     if image_id is None:
#         raise ValueError("Failed to get ImageID after insert")
#     conn.commit()
#     return image_id

# -----------------------------
# Insert a question and return QuestionID
# -----------------------------
def insert_question(image_id: int, question: str) -> int:
    if image_id is None:
        raise ValueError("Cannot insert question with NULL image_id")
    
    sql = """
    INSERT INTO Questions (ImageID, QuestionText)
    OUTPUT INSERTED.QuestionID
    VALUES (?, ?)
    """
    cursor.execute(sql, image_id, question)
    question_id = cursor.fetchone()[0]
    if question_id is None:
        raise ValueError("Failed to get QuestionID after insert")
    conn.commit()
    return question_id

# -----------------------------
# Insert an answer and return AnswerID
# -----------------------------
def insert_answer(question_id: int, answer: str, confidence: float) -> int:
    if question_id is None:
        raise ValueError("Cannot insert answer with NULL question_id")
    
    sql = """
    INSERT INTO Answers (QuestionID, AnswerText, ConfidenceScore)
    OUTPUT INSERTED.AnswerID
    VALUES (?, ?, ?)
    """
    cursor.execute(sql, question_id, answer, confidence)
    answer_id = cursor.fetchone()[0]
    if answer_id is None:
        raise ValueError("Failed to get AnswerID after insert")
    conn.commit()
    return answer_id

# -----------------------------
# Get or create answer for an image/question
# -----------------------------
def get_or_create_answer(image_id: int, question: str, generate_answer_fn):
    """
    Checks if question exists for an image:
      - If question exists and has answer → returns existing answer.
      - If question exists but no answer → generates and inserts answer.
      - If question doesn't exist → inserts question and generates answer.
    
    generate_answer_fn: a function that returns (answer, confidence)
    """
    cursor.execute(
        "SELECT QuestionID FROM Questions WHERE ImageID = ? AND QuestionText = ?",
        image_id, question
    )
    row = cursor.fetchone()

    if row:
        question_id = row[0]
        cursor.execute(
            "SELECT AnswerText, ConfidenceScore FROM Answers WHERE QuestionID = ?",
            question_id
        )
        ans_row = cursor.fetchone()
        if ans_row:
            return question_id, ans_row[0], ans_row[1], True  # Existing answer
        else:
            answer, confidence = generate_answer_fn()
            cursor.execute(
                "INSERT INTO Answers (QuestionID, AnswerText, ConfidenceScore) VALUES (?, ?, ?)",
                question_id, answer, confidence
            )
            conn.commit()
            return question_id, answer, confidence, False
    else:
        cursor.execute(
            "INSERT INTO Questions (ImageID, QuestionText) VALUES (?, ?)",
            image_id, question
        )
        conn.commit()
        cursor.execute(
            "SELECT QuestionID FROM Questions WHERE ImageID = ? AND QuestionText = ?",
            image_id, question
        )
        question_id = cursor.fetchone()[0]

        answer, confidence = generate_answer_fn()
        cursor.execute(
            "INSERT INTO Answers (QuestionID, AnswerText, ConfidenceScore) VALUES (?, ?, ?)",
            question_id, answer, confidence
        )
        conn.commit()
        return question_id, answer, confidence, False

def insert_generated_image(
    prompt: str,
    file_path: str,
    file_name: str,
    seed: int,
    negative_prompt: Optional[str] = None,
    num_inference_steps: int = 30,
    guidance_scale: float = 7.5,
    image_width: int = 512,
    image_height: int = 512,
    generation_duration: Optional[float] = None,
    model_used: str = "stable-diffusion-2-1",
    file_size: Optional[int] = None,
    status: str = "completed",
    error_message: Optional[str] = None
) -> int:
    """
    Insert a generated image record into the database.
    
    Args:
        prompt: The text prompt used to generate the image
        file_path: Full path where the image is saved
        file_name: Name of the saved file
        seed: Random seed used for generation
        negative_prompt: Negative prompt used (optional)
        num_inference_steps: Number of inference steps
        guidance_scale: Guidance scale value
        image_width: Width of generated image
        image_height: Height of generated image
        generation_duration: Time taken to generate (in seconds)
        model_used: Name/version of the model used
        file_size: Size of the file in bytes
        status: Status of generation (completed/failed/processing)
        error_message: Error message if generation failed
    
    Returns:
        int: GeneratedImageID of the inserted record
    """
    
    # Calculate file size if not provided
    if file_size is None and os.path.exists(file_path):
        file_size = os.path.getsize(file_path)
    
    sql = """
    INSERT INTO GeneratedImages (
        Prompt, NegativePrompt, FilePath, FileName,
        Seed, NumInferenceSteps, GuidanceScale,
        ImageWidth, ImageHeight, GenerationDuration,
        ModelUsed, Status, ErrorMessage, FileSize
    )
    OUTPUT INSERTED.GeneratedImageID
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    try:
        cursor.execute(
            sql,
            prompt,
            negative_prompt,
            file_path,
            file_name,
            seed,
            num_inference_steps,
            guidance_scale,
            image_width,
            image_height,
            generation_duration,
            model_used,
            status,
            error_message,
            file_size
        )
        
        generated_image_id = cursor.fetchone()[0]
        
        if generated_image_id is None:
            raise ValueError("Failed to get GeneratedImageID after insert")
        
        conn.commit()
        print(f"[SUCCESS] Inserted generated image with ID: {generated_image_id}")
        
        return generated_image_id
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Failed to insert generated image: {e}")
        raise


def get_generated_image_by_id(generated_image_id: int) -> Optional[Dict]:
    """
    Retrieve a generated image record by its ID.
    
    Args:
        generated_image_id: The ID of the generated image
    
    Returns:
        dict: Image record with all details, or None if not found
    """
    sql = """
    SELECT 
        GeneratedImageID, Prompt, NegativePrompt, FilePath, FileName,
        Seed, NumInferenceSteps, GuidanceScale, ImageWidth, ImageHeight,
        GenerationTime, GenerationDuration, ModelUsed, Status,
        ViewCount, DownloadCount, FileSize
    FROM GeneratedImages
    WHERE GeneratedImageID = ?
    """
    
    try:
        cursor.execute(sql, generated_image_id)
        row = cursor.fetchone()
        
        if row:
            return {
                "generated_image_id": row[0],
                "prompt": row[1],
                "negative_prompt": row[2],
                "file_path": row[3],
                "file_name": row[4],
                "seed": row[5],
                "num_inference_steps": row[6],
                "guidance_scale": row[7],
                "image_width": row[8],
                "image_height": row[9],
                "generation_time": row[10],
                "generation_duration": row[11],
                "model_used": row[12],
                "status": row[13],
                "view_count": row[14],
                "download_count": row[15],
                "file_size": row[16]
            }
        
        return None
        
    except Exception as e:
        print(f"[ERROR] Failed to get generated image: {e}")
        return None


def get_recent_generated_images(limit: int = 50) -> List[Dict]:
    """
    Get the most recently generated images.
    
    Args:
        limit: Maximum number of images to return
    
    Returns:
        list: List of image records
    """
    sql = """
    SELECT TOP (?)
        GeneratedImageID, Prompt, NegativePrompt, FilePath, FileName,
        Seed, ImageWidth, ImageHeight, GenerationTime,
        ViewCount, DownloadCount
    FROM GeneratedImages
    WHERE Status = 'completed'
    ORDER BY GenerationTime DESC
    """
    
    try:
        cursor.execute(sql, limit)
        rows = cursor.fetchall()
        
        images = []
        for row in rows:
            images.append({
                "generated_image_id": row[0],
                "prompt": row[1],
                "negative_prompt": row[2],
                "file_path": row[3],
                "file_name": row[4],
                "seed": row[5],
                "image_width": row[6],
                "image_height": row[7],
                "generation_time": row[8],
                "view_count": row[9],
                "download_count": row[10]
            })
        
        return images
        
    except Exception as e:
        print(f"[ERROR] Failed to get recent images: {e}")
        return []


def search_generated_images(search_term: str) -> List[Dict]:
    """
    Search generated images by prompt text.
    
    Args:
        search_term: Text to search for in prompts
    
    Returns:
        list: List of matching image records
    """
    sql = """
    SELECT 
        GeneratedImageID, Prompt, NegativePrompt, FilePath, FileName,
        Seed, GenerationTime, ViewCount, DownloadCount
    FROM GeneratedImages
    WHERE Status = 'completed'
        AND (Prompt LIKE ? OR NegativePrompt LIKE ?)
    ORDER BY GenerationTime DESC
    """
    
    try:
        search_pattern = f"%{search_term}%"
        cursor.execute(sql, search_pattern, search_pattern)
        rows = cursor.fetchall()
        
        images = []
        for row in rows:
            images.append({
                "generated_image_id": row[0],
                "prompt": row[1],
                "negative_prompt": row[2],
                "file_path": row[3],
                "file_name": row[4],
                "seed": row[5],
                "generation_time": row[6],
                "view_count": row[7],
                "download_count": row[8]
            })
        
        return images
        
    except Exception as e:
        print(f"[ERROR] Failed to search images: {e}")
        return []


def increment_view_count(generated_image_id: int) -> bool:
    """
    Increment the view count for a generated image.
    
    Args:
        generated_image_id: The ID of the image
    
    Returns:
        bool: True if successful, False otherwise
    """
    sql = """
    UPDATE GeneratedImages
    SET ViewCount = ViewCount + 1
    WHERE GeneratedImageID = ?
    """
    
    try:
        cursor.execute(sql, generated_image_id)
        conn.commit()
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Failed to increment view count: {e}")
        return False


def increment_download_count(generated_image_id: int) -> bool:
    """
    Increment the download count for a generated image.
    
    Args:
        generated_image_id: The ID of the image
    
    Returns:
        bool: True if successful, False otherwise
    """
    sql = """
    UPDATE GeneratedImages
    SET DownloadCount = DownloadCount + 1
    WHERE GeneratedImageID = ?
    """
    
    try:
        cursor.execute(sql, generated_image_id)
        conn.commit()
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Failed to increment download count: {e}")
        return False


def get_images_by_seed(seed: int) -> List[Dict]:
    """
    Get all images generated with a specific seed.
    
    Args:
        seed: The seed value to search for
    
    Returns:
        list: List of image records with that seed
    """
    sql = """
    SELECT 
        GeneratedImageID, Prompt, NegativePrompt, FilePath, FileName,
        Seed, GenerationTime, ImageWidth, ImageHeight
    FROM GeneratedImages
    WHERE Seed = ? AND Status = 'completed'
    ORDER BY GenerationTime DESC
    """
    
    try:
        cursor.execute(sql, seed)
        rows = cursor.fetchall()
        
        images = []
        for row in rows:
            images.append({
                "generated_image_id": row[0],
                "prompt": row[1],
                "negative_prompt": row[2],
                "file_path": row[3],
                "file_name": row[4],
                "seed": row[5],
                "generation_time": row[6],
                "image_width": row[7],
                "image_height": row[8]
            })
        
        return images
        
    except Exception as e:
        print(f"[ERROR] Failed to get images by seed: {e}")
        return []


def get_generation_statistics() -> Dict:
    """
    Get overall statistics about image generation.
    
    Returns:
        dict: Statistics including total images, avg duration, etc.
    """
    sql = """
    SELECT 
        COUNT(*) as TotalImages,
        COUNT(CASE WHEN Status = 'completed' THEN 1 END) as CompletedImages,
        COUNT(CASE WHEN Status = 'failed' THEN 1 END) as FailedImages,
        AVG(CASE WHEN Status = 'completed' THEN GenerationDuration END) as AvgDuration,
        SUM(FileSize) as TotalStorageUsed,
        SUM(ViewCount) as TotalViews,
        SUM(DownloadCount) as TotalDownloads
    FROM GeneratedImages
    """
    
    try:
        cursor.execute(sql)
        row = cursor.fetchone()
        
        if row:
            return {
                "total_images": row[0] or 0,
                "completed_images": row[1] or 0,
                "failed_images": row[2] or 0,
                "avg_duration_seconds": float(row[3]) if row[3] else 0.0,
                "total_storage_bytes": row[4] or 0,
                "total_views": row[5] or 0,
                "total_downloads": row[6] or 0
            }
        
        return {}
        
    except Exception as e:
        print(f"[ERROR] Failed to get statistics: {e}")
        return {}


def delete_generated_image(generated_image_id: int, delete_file: bool = False) -> bool:
    """
    Delete a generated image record from the database.
    
    Args:
        generated_image_id: The ID of the image to delete
        delete_file: If True, also delete the physical file
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get file path if we need to delete the file
        if delete_file:
            cursor.execute(
                "SELECT FilePath FROM GeneratedImages WHERE GeneratedImageID = ?",
                generated_image_id
            )
            row = cursor.fetchone()
            
            if row and row[0]:
                file_path = row[0]
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"[INFO] Deleted file: {file_path}")
        
        # Delete from database
        cursor.execute(
            "DELETE FROM GeneratedImages WHERE GeneratedImageID = ?",
            generated_image_id
        )
        conn.commit()
        
        print(f"[SUCCESS] Deleted generated image ID: {generated_image_id}")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Failed to delete generated image: {e}")
        return False


def add_prompt_tag(generated_image_id: int, tag_name: str) -> bool:
    """
    Add a tag to a generated image.
    
    Args:
        generated_image_id: The ID of the image
        tag_name: The tag to add
    
    Returns:
        bool: True if successful, False otherwise
    """
    sql = """
    INSERT INTO PromptTags (GeneratedImageID, TagName)
    VALUES (?, ?)
    """
    
    try:
        cursor.execute(sql, generated_image_id, tag_name.lower().strip())
        conn.commit()
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Failed to add tag: {e}")
        return False


def get_tags_for_image(generated_image_id: int) -> List[str]:
    """
    Get all tags for a specific image.
    
    Args:
        generated_image_id: The ID of the image
    
    Returns:
        list: List of tag names
    """
    sql = """
    SELECT TagName
    FROM PromptTags
    WHERE GeneratedImageID = ?
    ORDER BY CreatedAt DESC
    """
    
    try:
        cursor.execute(sql, generated_image_id)
        rows = cursor.fetchall()
        return [row[0] for row in rows]
        
    except Exception as e:
        print(f"[ERROR] Failed to get tags: {e}")
        return []