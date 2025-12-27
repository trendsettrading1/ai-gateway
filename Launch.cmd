@echo off
cd /d "C:\WINDOWS\system32\ai_gateway"
start node multimodal_gateway.js
timeout /t 2
start "" "desktop_app_with_images.html"
pause
