import pyodbc
import os
from datetime import datetime

# Direct connection parameters
DB_SERVER = r"(localdb)\MSSQLLocalDB"
DB_DATABASE = "VQA_DB"
UPLOAD_DIR = r"VQA\uploads"

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
