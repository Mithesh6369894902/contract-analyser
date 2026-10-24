#!/bin/bash
echo "========================================"
echo "  AI Contract Risk Analyzer - Setup"
echo "========================================"
echo ""

echo "Checking if Ollama is installed..."
if ! command -v ollama &> /dev/null; then
    echo ""
    echo "Ollama is not installed!"
    echo ""
    echo "Please install Ollama (FREE) from:"
    echo "https://ollama.ai/download"
    echo ""
    echo "Or run: curl -fsSL https://ollama.ai/install.sh | sh"
    echo ""
    exit 1
fi

echo "Ollama is installed!"
echo ""
echo "Pulling Llama 2 model (this may take a few minutes)..."
echo ""
ollama pull llama2

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "To start the app:"
echo "  1. Start Ollama: ollama serve"
echo "  2. Start backend: cd backend && npm run dev"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Open http://localhost:3000"
