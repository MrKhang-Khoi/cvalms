@echo off
title CVALMS SERVER - MAY CHU GIAO VIEN
color 0A
cd /d "%~dp0"

echo ==============================================================================
echo       MAY CHU GIAO VIEN - HE THONG LMS PHONG MAY TUONG TAC THCS
echo ==============================================================================
echo.
echo [*] Dang khoi dong Gateway Local Controller (Port 49150 va 49152)...

taskkill /F /IM node.exe /FI "WINDOWTITLE eq CvaLms*" >nul 2>&1
start "CvaLms Gateway Server" node gateway/server.js
timeout /t 2 >nul

echo [*] Dang mo Giao dien Web LMS tren Trinh duyet...
start "" "http://127.0.0.1:49150"

echo.
echo ==============================================================================
echo [V] MAY CHU GIAO VIEN DA KHOI DONG THANH CONG!
echo     - Dia chi truy cap: http://127.0.0.1:49150
echo     - Cong mTLS ket noi may hoc sinh: 49152
echo.
echo Giu cua so nay hoac thu nho xuong Taskbar trong suot buoi hoc.
echo ==============================================================================
timeout /t 5
