@echo off
title Discord Music Bot - Resetear Bot
color 0E
echo ========================================
echo      RESETEAR DISCORD MUSIC BOT
echo ========================================
echo.
echo 🔄 Reiniciando bot...
echo.

:: Detener cualquier proceso de Node.js
echo ⏹️  Deteniendo procesos existentes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Procesos detenidos correctamente
) else (
    echo ℹ️  No se encontraron procesos de Node.js ejecutándose
)

:: Esperar un momento
echo ⏳ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

:: Limpiar pantalla
cls
echo ========================================
echo      DISCORD MUSIC BOT - REINICIADO
echo ========================================
echo.

:: Cambiar al directorio del script
cd /d "%~dp0"

:: Verificar archivos necesarios
if not exist "index.js" (
    echo ❌ Error: No se encontró index.js
    pause
    exit /b 1
)

echo 🚀 Iniciando bot...
echo.

:: Ejecutar el bot
node index.js

:: Si el bot se detiene
echo.
echo 🛑 Bot detenido
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul