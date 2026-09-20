@echo off
chcp 65001 >nul
title CVALMS LOCAL LAB GATEWAY SERVER (Port 49150 / 49152)
color 0A

echo ==============================================================================
echo       KHOI DONG LOCAL LAB GATEWAY SERVER - LMS PHONG MAY TUONG TAC
echo ==============================================================================
echo.
echo [*] Dang kiem tra Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Khong tim thay Node.js! Vui long cai dat Node.js de chay Gateway.
    pause
    exit /b 1
)

echo [*] Dang khoi dong Gateway (Port 49152 cho Agent, Port 49150 cho Web LMS)...
echo.
node gateway/server.js
pause
