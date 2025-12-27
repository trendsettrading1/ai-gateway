@echo off
title AI Gateway Launcher
color 0A
echo ========================================
echo        AI GATEWAY LAUNCHER
echo ========================================
echo.
echo [1] Starting Gateway Server...
start "Gateway Server" cmd /c "node multimodal_gateway.js"
timeout /t 2 >nul
echo [2] Opening Web Interface...
start "" "desktop_app_with_images.html"
echo.
echo ========================================
echo Gateway: http://localhost:3003
echo Health:  http://localhost:3003/api/health
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
