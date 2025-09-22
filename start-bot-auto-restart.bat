@echo off
title Discord Music Bot - Auto Restart
echo 🤖 Discord Music Bot con Auto-Reinicio
echo =====================================
echo.

:start
echo [%time%] 🚀 Iniciando bot...
node index.js

echo.
echo [%time%] ⚠️ Bot desconectado. Reiniciando en 3 segundos...
timeout /t 3 /nobreak >nul
echo [%time%] 🔄 Reiniciando...
echo.
goto start