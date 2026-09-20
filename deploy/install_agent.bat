@echo off
title CVALMS HYBRID AGENT - BO CAI DAT PHONG MAY TRUONG HOC (18 MAY)
color 0B

echo ==============================================================================
echo       HE THONG LMS PHONG MAY TUONG TAC - BO CAI DAT AGENT GIAM SAT (18 MAY)
echo       Tuong thich o cung dong bang Deep Freeze - Chuan Windows Session API
echo ==============================================================================
echo.

:: 1. Kiem tra quyen Administrator va xac dinh thu muc cai dat
net session >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Quyen Administrator: CO
    set "INSTALL_DIR=C:\CVALMS-Agent"
    set "REG_KEY=HKLM\Software\Microsoft\Windows\CurrentVersion\Run"
) else (
    echo [*] Quyen Administrator: KHONG (Tu dong cai dat vao LocalAppData cua nguoi dung)
    set "INSTALL_DIR=%LOCALAPPDATA%\CVALMS-Agent"
    set "REG_KEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
)

:: 2. Nhap so thu tu may (1 - 18)
if not "%~1"=="" (
    set "MACHINE_NUM=%~1"
) else (
    set /p MACHINE_NUM=">> Nhap so thu tu may hoc sinh nay (1 den 18, vi du: 1 hoac 15): "
)
if "%MACHINE_NUM%"=="" set "MACHINE_NUM=1"

:: Format MAY-XX
if %MACHINE_NUM% LSS 10 (
    set "MACHINE_ID=MAY-0%MACHINE_NUM%"
) else (
    set "MACHINE_ID=MAY-%MACHINE_NUM%"
)

echo.
echo [*] Da chon dinh danh may: %MACHINE_ID%
echo [*] Dang thiet lap thu muc he thong tai %INSTALL_DIR%...

:: 3. Tao thu muc cai dat
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\certs" mkdir "%INSTALL_DIR%\certs"
if not exist "%USERPROFILE%\Desktop\BaiTap_TinHoc" mkdir "%USERPROFILE%\Desktop\BaiTap_TinHoc"

:: 4. Sao chep file CvaLmsAgent.exe va certs
set "SOURCE_DIR=%~dp0"
if exist "%SOURCE_DIR%CvaLmsAgent.exe" (
    copy /Y "%SOURCE_DIR%CvaLmsAgent.exe" "%INSTALL_DIR%\CvaLmsAgent.exe" >nul
) else if exist "%SOURCE_DIR%..\cvalms-agent\bin\Release\net8.0-windows\win-x64\publish\CvaLmsAgent.exe" (
    copy /Y "%SOURCE_DIR%..\cvalms-agent\bin\Release\net8.0-windows\win-x64\publish\CvaLmsAgent.exe" "%INSTALL_DIR%\CvaLmsAgent.exe" >nul
) else (
    echo [!] Khong tim thay file CvaLmsAgent.exe! Vui long kiem tra lai.
    if "%~3"=="--quiet" exit /b 1
    pause
    exit /b 1
)

if exist "%SOURCE_DIR%certs\agent.pfx" (
    copy /Y "%SOURCE_DIR%certs\agent.pfx" "%INSTALL_DIR%\certs\agent.pfx" >nul
) else if exist "%SOURCE_DIR%..\gateway\certs\agent.pfx" (
    copy /Y "%SOURCE_DIR%..\gateway\certs\agent.pfx" "%INSTALL_DIR%\certs\agent.pfx" >nul
)

:: 5. Nhap IP may Giao vien (Gateway)
if not "%~2"=="" (
    set "GATEWAY_IP=%~2"
) else (
    set /p GATEWAY_IP=">> Nhap dia chi IP LAN cua May Giao Vien (mac dinh: 127.0.0.1 hoac vi du: 192.168.1.100): "
)
if "%GATEWAY_IP%"=="" set "GATEWAY_IP=127.0.0.1"

:: 6. Tao file script khoi chay run_agent.vbs (chay an khong hien cua so den cmd)
echo Set WshShell = CreateObject("WScript.Shell") > "%INSTALL_DIR%\run_silent.vbs"
echo WshShell.Run """%INSTALL_DIR%\CvaLmsAgent.exe"" --machine %MACHINE_ID% --gateway %GATEWAY_IP% --port 49152 --cert ""%INSTALL_DIR%\certs\agent.pfx""", 0, False >> "%INSTALL_DIR%\run_silent.vbs"

:: 7. Dang ky tu khoi dong cung Windows vao Registry Run
reg add "%REG_KEY%" /v "CvalmsAgent" /t REG_SZ /d "wscript.exe "%INSTALL_DIR%\run_silent.vbs"" /f >nul 2>&1

:: 8. Thong qua Windows Firewall (neu co quyen admin)
netsh advfirewall firewall add rule name="CVALMS Agent" dir=out action=allow program="%INSTALL_DIR%\CvaLmsAgent.exe" enable=yes >nul 2>&1

echo.
echo ==============================================================================
echo [V] CAI DAT THANH CONG CHO MAY: %MACHINE_ID%!
echo.
echo [!] LUU Y VE O CUNG DONG BANG DEEP FREEZE:
echo     1. Neu may dang o che do Mo Bang (Thawed), bay gio hay mo Deep Freeze
echo        va chuyen sang che do Dong Bang (Boot Frozen).
echo     2. Thu muc Desktop\BaiTap_TinHoc da duoc tao san de hoc sinh luu bai.
echo     3. Agent se tu dong ket noi toi may Giao vien (%GATEWAY_IP%:49152) khi khoi dong.
echo ==============================================================================
echo.

:: 9. Dong cac phien CvaLmsAgent cu neu dang chay truoc khi khoi chay ban moi
taskkill /F /IM CvaLmsAgent.exe >nul 2>&1

:: Khoi chay ngay lap tuc
wscript.exe "%INSTALL_DIR%\run_silent.vbs"
echo [*] Da khoi chay Agent ngam trong phien Windows Console Session.
if "%~3"=="--quiet" goto end
echo Nhan phim bat ky de hoan tat.
pause >nul
:end
