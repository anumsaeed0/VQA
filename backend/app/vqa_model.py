import torch
from transformers import AutoProcessor, LlavaForConditionalGeneration
from PIL import Image
from .utils import format_prompt  # your helper to format prompts

# Load once
device = "cuda" if torch.cuda.is_available() else "cpu"
model_name = "llava-hf/llava-1.5-7b-hf"

processor = AutoProcessor.from_pretrained(model_name, use_fast=True)
model = LlavaForConditionalGeneration.from_pretrained(
    model_name, 
    torch_dtype=torch.float16 if device=="cuda" else torch.float32
)
model.to(device)
model.eval()

# def ask_vqa(image: Image.Image, question: str):
#     """
#     Perform VQA and return (answer, confidence)
#     """
#     prompt = format_prompt(question)
#     inputs = processor(images=image, text=prompt, return_tensors="pt").to(device)

#     with torch.no_grad():
#         outputs = model.generate(
#             **inputs,
#             max_new_tokens=50,
#             output_scores=True,
#             return_dict_in_generate=True
#         )
    
#     # Decode answer
#     answer = processor.batch_decode(outputs.sequences, skip_special_tokens=True)[0]

#     # Estimate confidence
#     if outputs.scores is not None:
#         last_token_logits = outputs.scores[-1].squeeze(0)
#         probs = torch.softmax(last_token_logits, dim=-1)
#         confidence = probs.max().item()
#     else:
#         confidence = 1.0  # fallback

#     return answer, confidence
def ask_vqa(image: Image.Image, question: str):
    """
    Perform VQA on a single image and question.
    Returns:
        answer (str)
        confidence (float) approximate
    """
    # Format prompt
    prompt = format_prompt(question)

    # Preprocess inputs
    inputs = processor(images=image, text=prompt, return_tensors="pt").to(device)

    # Generate tokens
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=500,
            output_scores=True,
            return_dict_in_generate=True,
            do_sample=False
        )

    # Decode answer text
    full_text = processor.batch_decode(outputs.sequences, skip_special_tokens=True)[0]

    # Strip the prompt to keep only the model's response
    if "ASSISTANT:" in full_text:
        answer = full_text.split("ASSISTANT:")[-1].strip()
    else:
        answer = full_text.strip()

    # Estimate confidence: softmax over logits of last token
    if outputs.scores is not None:
        last_token_logits = outputs.scores[-1].squeeze(0)
        probs = torch.softmax(last_token_logits, dim=-1)
        confidence = probs.max().item()
    else:
        confidence = 1.0  # fallback

    return answer, confidence
