@echo off
title AI Gateway Desktop
color 0A
echo.
echo ================================
echo      AI GATEWAY LAUNCHER
echo ================================
echo.
cd /d "C:\WINDOWS\system32\ai_gateway"
echo [1] Starting gateway server...
start "AI Gateway Server" node multimodal_gateway.js
timeout /t 3 >nul
echo [2] Opening desktop interface...
start "" "desktop_app_with_images.html"
echo.
echo ================================
echo ? Gateway running!
echo ?? http://localhost:3003
echo ================================
echo.
pause
