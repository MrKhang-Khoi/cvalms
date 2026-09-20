@echo off
chcp 65001 >nul
title CVALMS HYBRID AGENT - BO CAI DAT PHONG MAY TRUONG HOC (18 MAY)
color 0B

echo ==============================================================================
echo       HE THONG LMS PHONG MAY TUONG TAC - BO CAI DAT AGENT GIAM SAT (18 MAY)
echo       Tuong thich o cung dong bang Deep Freeze • Chuan Windows Session API
echo ==============================================================================
echo.

:: 1. Kiem tra quyen Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Vui long chay file nay bang quyen Run as Administrator!
    echo Nhan phim bat ky de thoat...
    pause >nul
    exit /b 1
)

:: 2. Nhap so thu tu may (1 - 18)
set /p MACHINE_NUM=">> Nhap so thu tu may hoc sinh nay (1 den 18, vi du: 1 hoac 15): "
if "%MACHINE_NUM%"=="" set MACHINE_NUM=1

:: Format MAY-XX
if %MACHINE_NUM% LSS 10 (
    set MACHINE_ID=MAY-0%MACHINE_NUM%
) else (
    set MACHINE_ID=MAY-%MACHINE_NUM%
)

echo.
echo [*] Da chon dinh danh may: %MACHINE_ID%
echo [*] Dang thiet lap thu muc he thong tai C:\CVALMS-Agent...

:: 3. Tao thu muc cai dat
if not exist "C:\CVALMS-Agent" mkdir "C:\CVALMS-Agent"
if not exist "C:\CVALMS-Agent\certs" mkdir "C:\CVALMS-Agent\certs"
if not exist "%USERPROFILE%\Desktop\BaiTap_TinHoc" mkdir "%USERPROFILE%\Desktop\BaiTap_TinHoc"

:: 4. Sao chep file CvaLmsAgent.exe va certs
set SOURCE_DIR=%~dp0
if exist "%SOURCE_DIR%CvaLmsAgent.exe" (
    copy /Y "%SOURCE_DIR%CvaLmsAgent.exe" "C:\CVALMS-Agent\CvaLmsAgent.exe" >nul
) else if exist "%SOURCE_DIR%..\cvalms-agent\bin\Release\net8.0-windows\win-x64\publish\CvaLmsAgent.exe" (
    copy /Y "%SOURCE_DIR%..\cvalms-agent\bin\Release\net8.0-windows\win-x64\publish\CvaLmsAgent.exe" "C:\CVALMS-Agent\CvaLmsAgent.exe" >nul
) else (
    echo [!] Khong tim thay file CvaLmsAgent.exe! Vui long kiem tra lai.
    pause
    exit /b 1
)

if exist "%SOURCE_DIR%certs\agent.pfx" (
    copy /Y "%SOURCE_DIR%certs\agent.pfx" "C:\CVALMS-Agent\certs\agent.pfx" >nul
) else if exist "%SOURCE_DIR%..\gateway\certs\agent.pfx" (
    copy /Y "%SOURCE_DIR%..\gateway\certs\agent.pfx" "C:\CVALMS-Agent\certs\agent.pfx" >nul
)

:: 5. Nhap IP may Giao vien (Gateway)
set /p GATEWAY_IP=">> Nhap dia chi IP LAN cua May Giao Vien (mac dinh: 127.0.0.1 hoac vi du: 192.168.1.100): "
if "%GATEWAY_IP%"=="" set GATEWAY_IP=127.0.0.1

:: 6. Tao file script khoi chay run_agent.vbs (chay an khong hien cua so den cmd)
echo Set WshShell = CreateObject("WScript.Shell") > "C:\CVALMS-Agent\run_silent.vbs"
echo WshShell.Run "C:\CVALMS-Agent\CvaLmsAgent.exe --machine %MACHINE_ID% --gateway %GATEWAY_IP% --port 49152 --cert C:\CVALMS-Agent\certs\agent.pfx", 0, False >> "C:\CVALMS-Agent\run_silent.vbs"

:: 7. Dang ky tu khoi dong cung Windows vao Registry Run
reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "CvalmsAgent" /t REG_SZ /d "wscript.exe C:\CVALMS-Agent\run_silent.vbs" /f >nul

:: 8. Thong qua Windows Firewall
netsh advfirewall firewall add rule name="CVALMS Agent" dir=out action=allow program="C:\CVALMS-Agent\CvaLmsAgent.exe" enable=yes >nul 2>&1

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

:: Khoi chay ngay lap tuc
wscript.exe "C:\CVALMS-Agent\run_silent.vbs"
echo [*] Da khoi chay Agent ngam trong phien Windows Console Session.
echo Nhan phim bat ky de hoan tat.
pause >nul
