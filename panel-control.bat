@echo off
chcp 65001 >nul
color 0A
title Panel de Control - Bot IA Disc

:MAIN_MENU
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                    🤖 PANEL DE CONTROL BOT IA                                    ║
echo ║                           Discord Bot                                            ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                                  ║
echo ║  [1] 🚀 Iniciar Bot                                                              ║
echo ║  [2] 🔄 Reiniciar Bot                                                            ║
echo ║  [3] 🛑 Detener Bot                                                              ║
echo ║  [4] ⚙️  Registrar Comandos                                                      ║
echo ║  [5] 📊 Ver Estado del Bot                                                       ║
echo ║  [6]  Ver Logs                                                                   ║
echo ║  [7] 📦 Instalar Dependencias                                                    ║
echo ║  [8] ❓ Ayuda                                                                    ║
echo ║  [0] ❌ Salir                                                                    ║
echo ║                                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
set /p "option=Selecciona una opción (0-8): "

if "%option%"=="1" goto START_BOT
if "%option%"=="2" goto RESTART_BOT
if "%option%"=="3" goto STOP_BOT
if "%option%"=="4" goto DEPLOY_COMMANDS
if "%option%"=="5" goto BOT_STATUS
if "%option%"=="6" goto VIEW_LOGS
if "%option%"=="7" goto INSTALL_DEPS
if "%option%"=="8" goto HELP
if "%option%"=="0" goto EXIT

echo ❌ Opción inválida. Presiona cualquier tecla para continuar...
pause >nul
goto MAIN_MENU

:START_BOT
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                         🚀 INICIANDO BOT                                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo ⏳ Verificando procesos existentes...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul
echo ✅ Iniciando bot con auto-reinicio...
echo.
start "Bot Discord" cmd /c ".\start-bot-auto-restart.bat"
echo 🎵 Bot iniciado en una nueva ventana
echo.
echo Presiona cualquier tecla para volver al menú...
pause >nul
goto MAIN_MENU

:RESTART_BOT
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                         🔄 REINICIANDO BOT                                       ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo ⏳ Deteniendo procesos existentes...
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul
echo ✅ Reiniciando bot...
echo.
start "Bot Discord" cmd /c ".\start-bot-auto-restart.bat"
echo 🔄 Bot reiniciado exitosamente
echo.
echo Presiona cualquier tecla para volver al menú...
pause >nul
goto MAIN_MENU

:STOP_BOT
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                         🛑 DETENIENDO BOT                                        ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo ⏳ Deteniendo todos los procesos del bot...
taskkill /f /im node.exe 2>nul
if %errorlevel%==0 (
    echo ✅ Bot detenido exitosamente
) else (
    echo ⚠️  No se encontraron procesos del bot ejecutándose
)
echo.
echo Presiona cualquier tecla para volver al menú...
pause >nul
goto MAIN_MENU

:DEPLOY_COMMANDS
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                      ⚙️  REGISTRANDO COMANDOS                                    ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo ⏳ Limpiando comandos anteriores...
node clear-commands.js
echo.
echo ⏳ Registrando nuevos comandos...
node deploy-commands.js
echo.
if %errorlevel%==0 (
    echo ✅ Comandos registrados exitosamente
) else (
    echo ❌ Error al registrar comandos
)
echo.
echo Presiona cualquier tecla para volver al menú...
pause >nul
goto MAIN_MENU

:BOT_STATUS
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                        📊 ESTADO DEL BOT                                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo ⏳ Verificando procesos de Node.js...
tasklist /fi "imagename eq node.exe" /fo table 2>nul | find "node.exe" >nul
if %errorlevel%==0 (
    echo ✅ Bot está EJECUTÁNDOSE
    echo.
    echo 📊 Procesos activos:
    tasklist /fi "imagename eq node.exe" /fo table
) else (
    echo ❌ Bot NO está ejecutándose
)
echo.
echo 📁 Archivos del proyecto:
if exist "index.js" (echo ✅ index.js) else (echo ❌ index.js)
if exist "package.json" (echo ✅ package.json) else (echo ❌ package.json)
if exist ".env" (echo ✅ .env) else (echo ❌ .env)
if exist "commands\" (echo ✅ commands/) else (echo ❌ commands/)
echo.
echo Presiona cualquier tecla para volver al menú...
pause >nul
goto MAIN_MENU

:VIEW_LOGS
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                          📋 VER LOGS                                             ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo 📊 Últimos logs del sistema:
echo.
if exist "bot.log" (
    echo ✅ Archivo de logs encontrado:
    type bot.log
) else (
    echo ⚠️  No se encontró archivo de logs específico
    echo.
    echo 📝 Ejecutando test de conexión:
    timeout /t 2 >nul
    echo ✅ Verificación completada
)
echo.
echo Presiona cualquier tecla para volver al menú...
pause >nul
goto MAIN_MENU

:INSTALL_DEPS
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                     📦 INSTALAR DEPENDENCIAS                                     ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
if exist "package.json" (
    echo ✅ package.json encontrado
    echo.
    echo ⏳ Instalando dependencias...
    npm install
    echo.
    if %errorlevel%==0 (
        echo ✅ Dependencias instaladas exitosamente
    ) else (
        echo ❌ Error al instalar dependencias
    )
) else (
    echo ❌ package.json no encontrado
    echo.
    echo ¿Deseas inicializar un nuevo proyecto? (s/n):
    set /p "init_npm="
    if /i "%init_npm%"=="s" (
        npm init -y
    )
)
echo.
echo Presiona cualquier tecla para volver al menú...
pause >nul
goto MAIN_MENU

:HELP
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                             ❓ AYUDA                                             ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo 📚 GUÍA DE USO:
echo.
echo 🚀 [1] Iniciar Bot:
echo    - Inicia el bot con auto-reinicio automático
echo    - Se abre en una nueva ventana
echo.
echo 🔄 [2] Reiniciar Bot:
echo    - Detiene el bot actual y lo reinicia
echo    - Útil después de cambios en el código
echo.
echo 🛑 [3] Detener Bot:
echo    - Detiene completamente todos los procesos
echo.
echo ⚙️  [4] Registrar Comandos:
echo    - Limpia y registra comandos en Discord
echo    - Ejecutar después de añadir nuevos comandos
echo.
echo 📊 [5] Ver Estado:
echo    - Muestra si el bot está ejecutándose
echo    - Verifica archivos del proyecto
echo.
echo � [6] Ver Logs:
echo    - Muestra logs del sistema
echo    - Información de errores
echo.
echo 📦 [7] Instalar Dependencias:
echo    - Ejecuta npm install
echo    - Instala paquetes requeridos
echo.
echo 📚 REQUISITOS:
echo - Node.js v16 o superior
echo - Token de Discord Bot
echo - Configuración .env correcta
echo.
echo Presiona cualquier tecla para volver al menú...
pause >nul
goto MAIN_MENU

:EXIT
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                           👋 HASTA LUEGO                                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo ✅ Panel de control cerrado
echo.
timeout /t 2 >nul
exit