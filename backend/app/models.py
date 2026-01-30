from pydantic import BaseModel
from typing import Optional

class VQARequest(BaseModel):
    question: str

class VQAResponse(BaseModel):
    answer: str
    confidence: float

class TextToImageRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = "blurry, bad quality, distorted, ugly, low resolution"
    num_inference_steps: Optional[int] = 30
    guidance_scale: Optional[float] = 7.5
    width: Optional[int] = 512
    height: Optional[int] = 512
    seed: Optional[int] = None

class TextToImageResponse(BaseModel):
    image_data: str
    seed: int
    prompt: str
    file_path: str
    db_id: Optional[int] = None  # Add this field