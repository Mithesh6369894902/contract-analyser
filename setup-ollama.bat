@echo off
echo ========================================
echo   AI Contract Risk Analyzer - Setup
echo ========================================
echo.

echo Checking if Ollama is installed...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Ollama is not installed!
    echo.
    echo Please install Ollama (FREE) from:
    echo https://ollama.ai/download
    echo.
    echo After installation, run this script again.
    pause
    exit /b
)

echo Ollama is installed!
echo.
echo Pulling Llama 2 model (this may take a few minutes)...
echo.
ollama pull llama2

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the app:
echo   1. Start Ollama: ollama serve
echo   2. Start backend: cd backend ^& npm run dev
echo   3. Start frontend: cd frontend ^& npm run dev
echo   4. Open http://localhost:3000
echo.
pause
