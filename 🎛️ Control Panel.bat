@echo off
title Discord Music Bot - Control Panel
color 0B
:menu
cls
echo ========================================
echo      DISCORD MUSIC BOT - CONTROL
echo ========================================
echo.
echo Selecciona una opción:
echo.
echo 1. 🚀 Iniciar Bot
echo 2. 🔄 Resetear Bot 
echo 3. ⏹️  Apagar Bot
echo 4. 📊 Ver Estado
echo 5. 📝 Ver Logs
echo 6. 🔧 Reinstalar Dependencias
echo 7. ❌ Salir
echo.
set /p choice=Ingresa tu opción (1-7): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto reset
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto install
if "%choice%"=="7" goto exit
echo Opción inválida. Intenta de nuevo.
timeout /t 2 /nobreak >nul
goto menu

:start
echo.
echo 🚀 Iniciando bot...
cd /d "%~dp0"
start "Discord Bot" cmd /k "node index.js"
echo ✅ Bot iniciado en nueva ventana
timeout /t 3 /nobreak >nul
goto menu

:reset
echo.
echo 🔄 Reseteando bot...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
cd /d "%~dp0"
start "Discord Bot" cmd /k "node index.js"
echo ✅ Bot reseteado
timeout /t 3 /nobreak >nul
goto menu

:stop
echo.
echo ⏹️ Apagando bot...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Bot apagado exitosamente
) else (
    echo ℹ️ El bot ya estaba apagado
)
timeout /t 3 /nobreak >nul
goto menu

:status
echo.
echo 📊 Estado del bot:
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if %errorlevel% equ 0 (
    echo ✅ Bot ejecutándose
    tasklist /FI "IMAGENAME eq node.exe" | findstr "node.exe"
) else (
    echo ❌ Bot no está ejecutándose
)
echo.
pause
goto menu

:logs
echo.
echo 📝 Abriendo logs...
if exist "bot.log" (
    notepad bot.log
) else (
    echo ℹ️ No se encontró archivo de logs
)
timeout /t 2 /nobreak >nul
goto menu

:install
echo.
echo 🔧 Reinstalando dependencias...
cd /d "%~dp0"
npm install
echo ✅ Dependencias instaladas
pause
goto menu

:exit
echo.
echo 👋 ¡Hasta luego!
timeout /t 2 /nobreak >nul
exit