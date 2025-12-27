# Multimodal AI Gateway Quick Start
Write-Host "🚀 Starting Multimodal AI Gateway" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js v18+" -ForegroundColor Red
    exit 1
}

# Check for dependencies
if (!(Test-Path "node_modules\express")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install express cors
}

# Create workspace directories
$directories = @("ai_workspace", "ai_workspace\projects", "ai_workspace\images", "ai_workspace\generated_images")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Start the gateway
Write-Host ""
Write-Host "Starting gateway on http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 App Generation Endpoints:" -ForegroundColor Yellow
Write-Host "  POST /api/human/process" -ForegroundColor Gray
Write-Host "  POST /api/deepseek/process" -ForegroundColor Gray
Write-Host "  POST /api/ai/process" -ForegroundColor Gray
Write-Host ""
Write-Host "🎨 Image Generation Endpoints:" -ForegroundColor Magenta
Write-Host "  POST /api/generate/image" -ForegroundColor Gray
Write-Host "  POST /api/ollama/generate" -ForegroundColor Gray
Write-Host "  POST /api/workflow/text-to-image" -ForegroundColor Gray
Write-Host "  GET  /api/image/prompts" -ForegroundColor Gray
Write-Host ""
Write-Host "📁 File Management:" -ForegroundColor Blue
Write-Host "  GET /api/health" -ForegroundColor Gray
Write-Host "  GET /api/download/:filename" -ForegroundColor Gray
Write-Host "  GET /api/image/prompt/:filename" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tip: Open desktop_app_with_images.html in your browser" -ForegroundColor Green
Write-Host ""

# Start the server
node multimodal_gateway.js
