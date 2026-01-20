@echo off
echo ========================================
echo Stylistic Fingerprint Analyzer
echo ========================================
echo.
echo Installing dependencies...
call npm install
echo.
echo ========================================
echo Starting development server...
echo Press Ctrl+C to stop the server
echo ========================================
echo.
call npm run dev
