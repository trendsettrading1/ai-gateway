const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class OllamaImageBridge {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434/api/generate';
        this.sdUrl = 'http://127.0.0.1:7860';
        this.workspace = path.join(__dirname, 'ai_workspace', 'generated_images');
        
        if (!fs.existsSync(this.workspace)) {
            fs.mkdirSync(this.workspace, { recursive: true });
        }
    }
    
    async enhancePromptWithOllama(userPrompt) {
        const systemPrompt = `You are an expert AI image prompt engineer. Enhance this image description into a detailed Stable Diffusion prompt.
        
Include:
1. Main subject and composition
2. Style and artistic details
3. Lighting and atmosphere
4. Color scheme
5. Technical details (quality, resolution)
6. Negative prompts

Original: ${userPrompt}

Enhanced prompt:`;
        
        const request = {
            model: 'llama3',
            prompt: systemPrompt,
            stream: false
        };
        
        return new Promise((resolve, reject) => {
            const cmd = `curl -s -X POST ${this.ollamaUrl} -H "Content-Type: application/json" -d '${JSON.stringify(request).replace(/'/g, "'\"'\"'")}'`;
            
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error('Ollama error:', error);
                    resolve(userPrompt); // Fallback to original
                    return;
                }
                
                try {
                    const response = JSON.parse(stdout);
                    resolve(response.response);
                } catch (e) {
                    console.error('Parse error:', e);
                    resolve(userPrompt); // Fallback to original
                }
            });
        });
    }
    
    async generateImageWithSD(prompt) {
        const request = {
            prompt: prompt,
            steps: 20,
            width: 512,
            height: 512,
            negative_prompt: "blurry, ugly, distorted, poorly drawn"
        };
        
        try {
            const fetch = require('node-fetch');
            const response = await fetch(`${this.sdUrl}/sdapi/v1/txt2img`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            if (!response.ok) {
                throw new Error(`SD API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Save the image
            const filename = `sd_${Date.now()}.png`;
            const filepath = path.join(this.workspace, filename);
            
            const imageData = data.images[0];
            const buffer = Buffer.from(imageData, 'base64');
            fs.writeFileSync(filepath, buffer);
            
            return {
                success: true,
                filepath: filepath,
                filename: filename,
                prompt: prompt,
                info: data.info ? JSON.parse(data.info) : {}
            };
            
        } catch (error) {
            console.error('SD generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async fullPipeline(userPrompt) {
        console.log('🚀 Starting Ollama → Stable Diffusion pipeline');
        console.log(`User prompt: ${userPrompt}`);
        
        // Step 1: Enhance prompt with Ollama
        console.log('🦙 Enhancing prompt with Ollama...');
        const enhancedPrompt = await this.enhancePromptWithOllama(userPrompt);
        console.log(`Enhanced prompt: ${enhancedPrompt.substring(0, 100)}...`);
        
        // Step 2: Generate image
        console.log('🎨 Generating image with Stable Diffusion...');
        const result = await this.generateImageWithSD(enhancedPrompt);
        
        if (result.success) {
            console.log(`✅ Image generated: ${result.filename}`);
            return {
                success: true,
                original_prompt: userPrompt,
                enhanced_prompt: enhancedPrompt,
                image_file: result.filename,
                image_path: result.filepath,
                download_url: `/api/download/image/${result.filename}`
            };
        } else {
            console.log('❌ Image generation failed');
            return {
                success: false,
                error: result.error,
                enhanced_prompt: enhancedPrompt,
                message: "Prompt enhanced but image generation failed"
            };
        }
    }
}

module.exports = OllamaImageBridge;
