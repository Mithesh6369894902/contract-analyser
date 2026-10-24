@echo off
echo ========================================
echo   AI Contract Risk Analyzer
echo ========================================
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd /d C:\Users\MITHESH D\OneDrive\Desktop\MONI\contract-analyzer\backend && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd /d C:\Users\MITHESH D\OneDrive\Desktop\MONI\contract-analyzer\frontend && npm run dev"

echo.
echo ========================================
echo   App is starting!
echo ========================================
echo.
echo   Computer: http://localhost:3000
echo.
echo   For Mobile Phone:
echo   1. Find your computer's IP address
echo   2. Open phone browser
echo   3. Go to http://YOUR-IP:3000
echo   4. Tap "Add to Home Screen" to install
echo.
echo   To find your IP: ipconfig
echo.
pause
