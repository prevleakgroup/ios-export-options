@echo off
REM ============================================================================
REM PREVLEAKGROUP™ DEPLOYMENT SCRIPT (Windows Batch)
REM Quick one-command deployment with automatic verification
REM ============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   PREVLEAKGROUP™ - ONE-COMMAND DEPLOYMENT                     ║
echo ║   Deploying all 5 brands to Firebase                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell not found. Please install PowerShell.
    exit /b 1
)

REM Run the PowerShell deployment script
echo Step 1: Starting deployment...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "cd '%cd%'; & '.\scripts\deploy-all.ps1' -FirebaseProject 'saferide-peld8' -Verbose"

if %errorlevel% equ 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║              DEPLOYMENT COMPLETED SUCCESSFULLY ✓               ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    echo Next Steps:
    echo   1. Verify at: https://saferide-peld8.web.app
    echo   2. Check health: https://saferide-peld8.web.app/health
    echo   3. Run validation: node scripts/validate-brand-anchors.js
    echo.
) else (
    echo.
    echo ❌ DEPLOYMENT FAILED - Check logs above
    exit /b 1
)
