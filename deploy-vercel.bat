@echo off
cls
echo ============================================
echo   SmartReviewAI - Deploy to Vercel
echo ============================================
echo.
echo 1. Building frontend production bundle...
call npm run build
echo.
echo 2. Launching Vercel Deployment...
echo    If this is your first time, Vercel will ask you to login in your browser.
echo.
npx vercel --prod
echo.
echo ============================================
echo   Deployment complete!
echo ============================================
pause
