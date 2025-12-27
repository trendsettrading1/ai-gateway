@echo off
echo Starting AI Gateway Desktop...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start the Electron app
echo Starting application...
call npm start

pause
