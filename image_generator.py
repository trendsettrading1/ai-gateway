# image_generator.py - Bridge between gateway and image tools
import requests
import json
import os
import sys
from pathlib import Path

class ImageGenerator:
    def __init__(self):
        self.gateway_url = "http://localhost:3003"
        self.images_dir = Path("ai_workspace/images")
        self.images_dir.mkdir(parents=True, exist_ok=True)
        
    def get_prompt_from_gateway(self, prompt_id):
        """Get a saved prompt from gateway"""
        try:
            response = requests.get(f"{self.gateway_url}/api/image/prompt/{prompt_id}", timeout=10)
            if response.status_code == 200:
                return response.text
        except Exception as e:
            print(f"Error getting prompt: {e}")
        return None
    
    def generate_with_dalle(self, prompt, api_key=None):
        """Generate image using DALL-E API"""
        try:
            import openai
            openai.api_key = api_key or os.getenv("OPENAI_API_KEY")
            
            response = openai.Image.create(
                prompt=prompt,
                n=1,
                size="1024x1024"
            )
            
            image_url = response['data'][0]['url']
            
            # Download the image
            img_response = requests.get(image_url)
            filename = f"dalle_{hash(prompt) % 10000}.png"
            filepath = self.images_dir / filename
            
            with open(filepath, 'wb') as f:
                f.write(img_response.content)
            
            return {
                "success": True,
                "engine": "DALL-E",
                "file": filename,
                "path": str(filepath),
                "prompt": prompt
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_with_stable_diffusion(self, prompt, sd_url="http://127.0.0.1:7860"):
        """Generate image using Stable Diffusion API"""
        try:
            payload = {
                "prompt": prompt,
                "steps": 20,
                "width": 512,
                "height": 512
            }
            
            response = requests.post(f"{sd_url}/sdapi/v1/txt2img", json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                import base64
                from io import BytesIO
                from PIL import Image
                
                # Decode and save image
                image_data = result['images'][0]
                image = Image.open(BytesIO(base64.b64decode(image_data)))
                
                filename = f"sd_{hash(prompt) % 10000}.png"
                filepath = self.images_dir / filename
                image.save(filepath)
                
                return {
                    "success": True,
                    "engine": "Stable Diffusion",
                    "file": filename,
                    "path": str(filepath),
                    "prompt": prompt
                }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_image_workflow(self, text_description):
        """Full workflow: Text → Gateway → Enhanced Prompt → Image"""
        print(f"Starting workflow for: {text_description}")
        
        # Step 1: Send to gateway for prompt enhancement
        try:
            gateway_response = requests.post(
                f"{self.gateway_url}/api/generate/image",
                json={
                    "prompt": text_description,
                    "source": "python_script",
                    "session_id": f"workflow_{os.getpid()}"
                },
                timeout=10
            )
            
            if gateway_response.status_code != 200:
                return {"error": "Gateway request failed"}
            
            gateway_data = gateway_response.json()
            
            if not gateway_data.get("success"):
                return {"error": "Gateway processing failed"}
            
            # Step 2: Get the enhanced prompt
            prompt_filename = gateway_data["file"]
            enhanced_prompt = self.get_prompt_from_gateway(prompt_filename)
            
            if not enhanced_prompt:
                return {"error": "Could not retrieve enhanced prompt"}
            
            print(f"Enhanced prompt: {enhanced_prompt[:100]}...")
            
            # Step 3: Try to generate image
            result = None
            
            # Try DALL-E first if API key exists
            if os.getenv("OPENAI_API_KEY"):
                print("Attempting DALL-E generation...")
                result = self.generate_with_dalle(enhanced_prompt)
            
            # If DALL-E fails or not available, try Stable Diffusion
            if not result or not result.get("success"):
                print("Attempting Stable Diffusion generation...")
                result = self.generate_with_stable_diffusion(enhanced_prompt)
            
            if result and result.get("success"):
                return {
                    "success": True,
                    "original_text": text_description,
                    "enhanced_prompt": enhanced_prompt,
                    "image_result": result,
                    "gateway_data": gateway_data
                }
            else:
                return {
                    "success": False,
                    "message": "Image generation failed",
                    "enhanced_prompt": enhanced_prompt,
                    "gateway_data": gateway_data,
                    "next_steps": [
                        "1. Install Stable Diffusion WebUI",
                        "2. Or set OPENAI_API_KEY for DALL-E",
                        "3. Use the prompt manually with any image tool"
                    ]
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        generator = ImageGenerator()
        text = " ".join(sys.argv[1:])
        result = generator.create_image_workflow(text)
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python image_generator.py \"your image description\"")
        print("Example: python image_generator.py \"a beautiful sunset over mountains\"")
