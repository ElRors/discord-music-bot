@echo off
title Discord Music Bot - Apagar Bot
color 0C
echo ========================================
echo       APAGAR DISCORD MUSIC BOT
echo ========================================
echo.

:: Mostrar procesos de Node.js antes de cerrar
echo 🔍 Buscando procesos del bot...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if %errorlevel% equ 0 (
    echo ✅ Procesos de Node.js encontrados:
    tasklist /FI "IMAGENAME eq node.exe" | findstr "node.exe"
    echo.
    echo ⏹️  Cerrando bot de Discord...
    
    :: Detener procesos de Node.js
    taskkill /F /IM node.exe 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Bot cerrado exitosamente
    ) else (
        echo ❌ Error al cerrar el bot
    )
) else (
    echo ℹ️  No se encontraron procesos del bot ejecutándose
    echo 💤 El bot ya estaba apagado
)

echo.
echo 🔌 Desconectando de Discord...
echo ✅ Bot completamente apagado
echo.
echo ========================================
echo           BOT DESCONECTADO
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul