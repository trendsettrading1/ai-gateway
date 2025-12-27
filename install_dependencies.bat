@echo off
echo Installing Multimodal AI Gateway Dependencies
echo =============================================
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if in correct directory
if not exist "multimodal_gateway.js" (
    echo Please run this script from the ai_gateway directory
    pause
    exit /b 1
)

echo Installing npm dependencies...
npm init -y
npm install express cors

echo Creating directories...
mkdir ai_workspace 2>nul
mkdir ai_workspace\projects 2>nul
mkdir ai_workspace\images 2>nul
mkdir ai_workspace\generated_images 2>nul

echo Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Python is optional for advanced image generation.
    echo Install Python 3.8+ from https://www.python.org/ if needed.
)

echo.
echo ✅ Setup complete!
echo.
echo To start the gateway:
echo 1. Open Command Prompt as Administrator
echo 2. Navigate to this directory
echo 3. Run: node multimodal_gateway.js
echo.
echo To use the desktop app:
echo 1. Open desktop_app_with_images.html in your browser
echo 2. Make sure gateway is running on port 3003
echo.
pause
