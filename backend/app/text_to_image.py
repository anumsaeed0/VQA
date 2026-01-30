# app/text_to_image.py - Updated with Database Integration
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from PIL import Image
import os
import base64
from io import BytesIO
from datetime import datetime
import time
from typing import Tuple, Optional

# Import database functions
from app.db import insert_generated_image, increment_download_count

# Configuration
GENERATED_IMAGES_DIR = r"C:\Users\ADMIN\Downloads\multimodal_lab\VQA\generated_images"
os.makedirs(GENERATED_IMAGES_DIR, exist_ok=True)

# Initialize the Stable Diffusion pipeline
device = "cuda" if torch.cuda.is_available() else "cpu"
model_id = "runwayml/stable-diffusion-v1-5"

print(f"[INFO] Loading Stable Diffusion model on {device}...")

# Load pipeline with optimizations
pipe = StableDiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    safety_checker=None,
    requires_safety_checker=False
)

# Use DPM++ scheduler for better quality and faster generation
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)

# Move to device
pipe = pipe.to(device)

# Enable memory optimizations if on CUDA
if device == "cuda":
    pipe.enable_attention_slicing()
    # Uncomment if you have limited VRAM (< 8GB)
    # pipe.enable_sequential_cpu_offload()

print("[SUCCESS] Stable Diffusion model loaded successfully!")


def generate_image(
    prompt: str,
    negative_prompt: str = "blurry, bad quality, distorted, ugly, low resolution",
    num_inference_steps: int = 30,
    guidance_scale: float = 7.5,
    width: int = 512,
    height: int = 512,
    seed: int = None,
    save_to_db: bool = True,
) -> Tuple[Image.Image, int, str, Optional[int]]:
    """
    Generate an image from a text prompt using Stable Diffusion.
    
    Args:
        prompt: Text description of the desired image
        negative_prompt: What to avoid in the image
        num_inference_steps: Number of denoising steps (higher = better quality but slower)
        guidance_scale: How closely to follow the prompt (7-9 is typical)
        width: Image width (must be multiple of 8)
        height: Image height (must be multiple of 8)
        seed: Random seed for reproducibility
        save_to_db: Whether to save metadata to database
    
    Returns:
        tuple: (PIL.Image, seed, file_path, db_id)
    """
    
    # Set random seed for reproducibility
    if seed is None:
        seed = torch.randint(0, 2**32 - 1, (1,)).item()
    
    generator = torch.Generator(device=device).manual_seed(seed)
    
    print(f"[INFO] Generating image with prompt: '{prompt}'")
    print(f"[INFO] Using seed: {seed}")
    
    # Track generation time
    start_time = time.time()
    
    try:
        # Generate image
        with torch.no_grad():
            result = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                width=width,
                height=height,
                generator=generator,
            )
        
        image = result.images[0]
        
        # Calculate generation duration
        generation_duration = time.time() - start_time
        
        # Save image to disk
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_prompt = prompt[:50].replace(" ", "_").replace("/", "_").replace("\\", "_")
        filename = f"generated_{timestamp}_{safe_prompt}_seed{seed}.png"
        file_path = os.path.join(GENERATED_IMAGES_DIR, filename)
        
        image.save(file_path)
        print(f"[SUCCESS] Image saved to: {file_path}")
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Save to database
        db_id = None
        if save_to_db:
            try:
                db_id = insert_generated_image(
                    prompt=prompt,
                    file_path=file_path,
                    file_name=filename,
                    seed=seed,
                    negative_prompt=negative_prompt,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    image_width=width,
                    image_height=height,
                    generation_duration=generation_duration,
                    model_used=model_id,
                    file_size=file_size,
                    status="completed"
                )
                print(f"[SUCCESS] Saved to database with ID: {db_id}")
            except Exception as e:
                print(f"[WARNING] Could not save to database: {e}")
        
        return image, seed, file_path, db_id
        
    except Exception as e:
        # Log failure to database
        error_message = str(e)
        print(f"[ERROR] Image generation failed: {error_message}")
        
        if save_to_db:
            try:
                # Create a placeholder filename for failed generation
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"failed_{timestamp}.png"
                file_path = os.path.join(GENERATED_IMAGES_DIR, filename)
                
                db_id = insert_generated_image(
                    prompt=prompt,
                    file_path=file_path,
                    file_name=filename,
                    seed=seed or 0,
                    negative_prompt=negative_prompt,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    image_width=width,
                    image_height=height,
                    generation_duration=time.time() - start_time,
                    model_used=model_id,
                    status="failed",
                    error_message=error_message
                )
            except Exception as db_error:
                print(f"[ERROR] Could not log failure to database: {db_error}")
        
        raise


def image_to_base64(image: Image.Image) -> str:
    """
    Convert PIL Image to base64 string for sending to frontend.
    
    Args:
        image: PIL Image object
    
    Returns:
        str: Base64 encoded image string
    """
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode("utf-8")
    return f"data:image/png;base64,{img_base64}"


def batch_generate_images(
    prompts: list,
    negative_prompt: str = "blurry, bad quality, distorted, ugly, low resolution",
    num_inference_steps: int = 30,
    guidance_scale: float = 7.5,
    width: int = 512,
    height: int = 512,
    seed: int = None,
    save_to_db: bool = True,
):
    """
    Generate multiple images from a list of prompts.
    
    Args:
        prompts: List of text descriptions
        Other args same as generate_image()
    
    Returns:
        list: List of tuples (PIL.Image, seed, file_path, db_id)
    """
    results = []
    
    for i, prompt in enumerate(prompts):
        print(f"[INFO] Generating image {i+1}/{len(prompts)}")
        
        # Use different seed for each image if not specified
        current_seed = seed + i if seed is not None else None
        
        try:
            image, used_seed, file_path, db_id = generate_image(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                width=width,
                height=height,
                seed=current_seed,
                save_to_db=save_to_db,
            )
            
            results.append((image, used_seed, file_path, db_id))
            
        except Exception as e:
            print(f"[ERROR] Failed to generate image {i+1}: {e}")
            # Continue with next image
            continue
    
    return results


def record_download(db_id: int) -> bool:
    """
    Record that an image was downloaded.
    
    Args:
        db_id: Database ID of the generated image
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        return increment_download_count(db_id)
    except Exception as e:
        print(f"[ERROR] Failed to record download: {e}")
        return False


# Example usage and test function
if __name__ == "__main__":
    # Test the text-to-image generation with database integration
    test_prompt = "A beautiful sunset over mountains, digital art, highly detailed"
    
    print("\n" + "="*50)
    print("Testing Text-to-Image Generation with Database")
    print("="*50 + "\n")
    
    image, seed, filepath, db_id = generate_image(
        prompt=test_prompt,
        num_inference_steps=25,
        guidance_scale=7.5,
        width=512,
        height=512,
        save_to_db=True
    )
    
    print(f"\n[SUCCESS] Test completed!")
    print(f"Image saved to: {filepath}")
    print(f"Seed used: {seed}")
    print(f"Database ID: {db_id}")
    
    # Test batch generation
    print("\n" + "="*50)
    print("Testing Batch Generation with Database")
    print("="*50 + "\n")
    
    batch_prompts = [
        "A cat wearing a wizard hat, fantasy art",
        "A futuristic city at night, cyberpunk style",
        "A peaceful forest with sunlight filtering through trees"
    ]
    
    batch_results = batch_generate_images(
        prompts=batch_prompts,
        num_inference_steps=20,
        seed=42,
        save_to_db=True
    )
    
    print(f"\n[SUCCESS] Generated {len(batch_results)} images!")
    for i, (img, s, path, db_id) in enumerate(batch_results):
        print(f"  Image {i+1}: DB ID = {db_id}, Seed = {s}")

# import torch
# from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
# from PIL import Image
# import io
# import base64
# from datetime import datetime
# import os

# # Configuration
# DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# MODEL_ID = "stabilityai/stable-diffusion-2-1"
# GENERATED_IMAGES_DIR = r"C:\Users\ADMIN\Downloads\multimodal_lab\VQA\generated_images"

# # Create directory if it doesn't exist
# os.makedirs(GENERATED_IMAGES_DIR, exist_ok=True)

# # Load model once at startup
# print(f"Loading Stable Diffusion model on {DEVICE}...")
# pipe = StableDiffusionPipeline.from_pretrained(
#     MODEL_ID,
#     torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
#     safety_checker=None,  # Remove for faster inference (optional)
# )
# pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
# pipe = pipe.to(DEVICE)
# pipe.enable_attention_slicing()  # Memory optimization

# print("✅ Model loaded successfully!")

# def generate_image(
#     prompt: str,
#     negative_prompt: str = "blurry, bad quality, distorted, ugly, low resolution",
#     num_inference_steps: int = 30,
#     guidance_scale: float = 7.5,
#     width: int = 512,
#     height: int = 512,
#     seed: int = None
# ):
#     """
#     Generate an image from text prompt using Stable Diffusion
    
#     Args:
#         prompt: Text description of desired image
#         negative_prompt: What to avoid in the image
#         num_inference_steps: Number of denoising steps (higher = better quality, slower)
#         guidance_scale: How closely to follow the prompt (7-15 recommended)
#         width: Image width (must be divisible by 8)
#         height: Image height (must be divisible by 8)
#         seed: Random seed for reproducibility
    
#     Returns:
#         tuple: (PIL Image, seed used, file_path)
#     """
#     try:
#         # Set random seed if provided
#         generator = None
#         if seed is not None:
#             generator = torch.Generator(device=DEVICE).manual_seed(seed)
#         else:
#             seed = torch.randint(0, 1000000, (1,)).item()
#             generator = torch.Generator(device=DEVICE).manual_seed(seed)
        
#         # Generate image
#         print(f"Generating image with prompt: {prompt[:50]}...")
#         with torch.inference_mode():
#             result = pipe(
#                 prompt=prompt,
#                 negative_prompt=negative_prompt,
#                 num_inference_steps=num_inference_steps,
#                 guidance_scale=guidance_scale,
#                 width=width,
#                 height=height,
#                 generator=generator,
#             )
        
#         image = result.images[0]
        
#         # Save image to disk
#         timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
#         safe_prompt = "".join(c if c.isalnum() else "_" for c in prompt[:30])
#         filename = f"{timestamp}_{safe_prompt}_seed{seed}.png"
#         file_path = os.path.join(GENERATED_IMAGES_DIR, filename)
#         image.save(file_path)
        
#         print(f"✅ Image generated and saved: {filename}")
#         return image, seed, file_path
        
#     except Exception as e:
#         print(f"❌ Error generating image: {e}")
#         raise e


# def image_to_base64(image: Image.Image) -> str:
#     """Convert PIL Image to base64 string"""
#     buffered = io.BytesIO()
#     image.save(buffered, format="PNG")
#     img_str = base64.b64encode(buffered.getvalue()).decode()
#     return f"data:image/png;base64,{img_str}"