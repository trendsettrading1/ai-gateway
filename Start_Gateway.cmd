@echo off
title AI Gateway (User Directory)
color 0A
cls
echo.
echo ===================================
echo        AI GATEWAY - FIXED
echo ===================================
echo.

cd /d "%USERPROFILE%\AI_Gateway"

echo [1] Starting gateway server...
start "AI Gateway Server" node gateway_simple.js
timeout /t 3 >nul

echo [2] Opening desktop interface...
start "" "desktop_app_with_images.html"

echo.
echo ===================================
echo ? Gateway running on port 3003
echo ?? Location: %USERPROFILE%\AI_Gateway
echo ?? Interface opened in browser
echo ===================================
echo.
echo Press any key to stop the gateway...
pause >nul

echo.
echo [3] Stopping gateway...
taskkill /f /im node.exe >nul 2>&1
echo Gateway stopped.
timeout /t 2 >nul
