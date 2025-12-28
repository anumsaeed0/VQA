from PIL import Image
import io

def load_image_from_bytes(file_bytes: bytes) -> Image.Image:
    """
    Convert uploaded bytes into a PIL Image.
    """
    return Image.open(io.BytesIO(file_bytes)).convert("RGB")

def format_prompt(question: str) -> str:
    """
    Format the prompt for LLaVA model.
    """
    return f"USER: <image>\n{question} ASSISTANT:"

