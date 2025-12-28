from pydantic import BaseModel

class VQARequest(BaseModel):
    question: str

class VQAResponse(BaseModel):
    answer: str
    confidence: float