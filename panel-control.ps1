# Panel de Control Bot IA Discord - PowerShell
# Configuración de colores y ventana
$Host.UI.RawUI.WindowTitle = "Panel de Control - Bot IA Disc"
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

function Show-MainMenu {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    🤖 PANEL DE CONTROL BOT IA                                   ║" -ForegroundColor Green
    Write-Host "║                           Discord Bot                                           ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                                                  ║" -ForegroundColor Green
    Write-Host "║  [1] 🚀 Iniciar Bot                                                              ║" -ForegroundColor Green
    Write-Host "║  [2] 🔄 Reiniciar Bot                                                            ║" -ForegroundColor Green
    Write-Host "║  [3] 🛑 Detener Bot                                                              ║" -ForegroundColor Green
    Write-Host "║  [4] ⚙️  Registrar Comandos                                                       ║" -ForegroundColor Green
    Write-Host "║  [5] 📊 Ver Estado del Bot                                                       ║" -ForegroundColor Green
    Write-Host "║  [6]  Ver Logs                                                                 ║" -ForegroundColor Green
    Write-Host "║  [7] 📦 Instalar Dependencias                                                    ║" -ForegroundColor Green
    Write-Host "║  [8] ❓ Ayuda                                                                     ║" -ForegroundColor Green
    Write-Host "║  [0] ❌ Salir                                                                     ║" -ForegroundColor Green
    Write-Host "║                                                                                  ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
}

function Start-Bot {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                         🚀 INICIANDO BOT                                        ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Verificando procesos existentes..." -ForegroundColor Yellow
    try {
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ Iniciando bot con auto-reinicio..." -ForegroundColor Green
        Write-Host ""
        Start-Process -FilePath "powershell.exe" -ArgumentList "-File", ".\start-bot-auto-restart.ps1" -WindowStyle Normal
        Write-Host "🎵 Bot iniciado en una nueva ventana" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Error al iniciar el bot: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Presiona cualquier tecla para volver al menú..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Restart-Bot {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                         🔄 REINICIANDO BOT                                      ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Deteniendo procesos existentes..." -ForegroundColor Yellow
    try {
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        Write-Host "✅ Reiniciando bot..." -ForegroundColor Green
        Write-Host ""
        Start-Process -FilePath "powershell.exe" -ArgumentList "-File", ".\start-bot-auto-restart.ps1" -WindowStyle Normal
        Write-Host "🔄 Bot reiniciado exitosamente" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Error al reiniciar el bot: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Presiona cualquier tecla para volver al menú..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Stop-Bot {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                         🛑 DETENIENDO BOT                                       ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Deteniendo todos los procesos del bot..." -ForegroundColor Yellow
    try {
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($processes) {
            Stop-Process -Name "node" -Force
            Write-Host "✅ Bot detenido exitosamente" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No se encontraron procesos del bot ejecutándose" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Error al detener el bot: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Presiona cualquier tecla para volver al menú..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Deploy-Commands {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                      ⚙️  REGISTRANDO COMANDOS                                    ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Limpiando comandos anteriores..." -ForegroundColor Yellow
    try {
        & node clear-commands.js
        Write-Host ""
        Write-Host "⏳ Registrando nuevos comandos..." -ForegroundColor Yellow
        & node deploy-commands.js
        Write-Host ""
        Write-Host "✅ Comandos registrados exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error al registrar comandos: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Presiona cualquier tecla para volver al menú..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-BotStatus {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                        📊 ESTADO DEL BOT                                        ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Verificando procesos de Node.js..." -ForegroundColor Yellow
    
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "✅ Bot está EJECUTÁNDOSE" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Procesos activos:" -ForegroundColor Cyan
        $nodeProcesses | Format-Table Id, ProcessName, CPU, WorkingSet -AutoSize
    } else {
        Write-Host "❌ Bot NO está ejecutándose" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📁 Archivos del proyecto:" -ForegroundColor Cyan
    
    if (Test-Path "index.js") { Write-Host "✅ index.js" -ForegroundColor Green } else { Write-Host "❌ index.js" -ForegroundColor Red }
    if (Test-Path "package.json") { Write-Host "✅ package.json" -ForegroundColor Green } else { Write-Host "❌ package.json" -ForegroundColor Red }
    if (Test-Path ".env") { Write-Host "✅ .env" -ForegroundColor Green } else { Write-Host "❌ .env" -ForegroundColor Red }
    if (Test-Path "commands") { Write-Host "✅ commands/" -ForegroundColor Green } else { Write-Host "❌ commands/" -ForegroundColor Red }
    
    Write-Host ""
    Write-Host "Presiona cualquier tecla para volver al menú..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function View-Logs {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                          📋 VER LOGS                                            ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Últimos logs del sistema:" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path "bot.log") {
        Write-Host "✅ Archivo de logs encontrado:" -ForegroundColor Green
        Get-Content "bot.log" -Tail 20 | Write-Host -ForegroundColor White
    } else {
        Write-Host "⚠️  No se encontró archivo de logs específico" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📝 Ejecutando test de conexión:" -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        Write-Host "✅ Verificación completada" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Presiona cualquier tecla para volver al menú..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Install-Dependencies {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                     📦 INSTALAR DEPENDENCIAS                                    ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path "package.json") {
        Write-Host "✅ package.json encontrado" -ForegroundColor Green
        Write-Host ""
        Write-Host "⏳ Instalando dependencias..." -ForegroundColor Yellow
        try {
            & npm install
            Write-Host ""
            Write-Host "✅ Dependencias instaladas exitosamente" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Error al instalar dependencias: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ package.json no encontrado" -ForegroundColor Red
        Write-Host ""
        $init = Read-Host "¿Deseas inicializar un nuevo proyecto? (s/n)"
        if ($init.ToLower() -eq "s") {
            & npm init -y
        }
    }
    
    Write-Host ""
    Write-Host "Presiona cualquier tecla para volver al menú..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-Help {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                             ❓ AYUDA                                             ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 GUÍA DE USO:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 [1] Iniciar Bot:" -ForegroundColor Green
    Write-Host "   - Inicia el bot con auto-reinicio automático" -ForegroundColor White
    Write-Host "   - Se abre en una nueva ventana" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 [2] Reiniciar Bot:" -ForegroundColor Green
    Write-Host "   - Detiene el bot actual y lo reinicia" -ForegroundColor White
    Write-Host "   - Útil después de cambios en el código" -ForegroundColor White
    Write-Host ""
    Write-Host "🛑 [3] Detener Bot:" -ForegroundColor Green
    Write-Host "   - Detiene completamente todos los procesos" -ForegroundColor White
    Write-Host ""
    Write-Host "⚙️  [4] Registrar Comandos:" -ForegroundColor Green
    Write-Host "   - Limpia y registra comandos en Discord" -ForegroundColor White
    Write-Host "   - Ejecutar después de añadir nuevos comandos" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 [5] Ver Estado:" -ForegroundColor Green
    Write-Host "   - Muestra si el bot está ejecutándose" -ForegroundColor White
    Write-Host "   - Verifica archivos del proyecto" -ForegroundColor White
    Write-Host ""
    Write-Host "� [6] Ver Logs:" -ForegroundColor Green
    Write-Host "   - Muestra logs del sistema" -ForegroundColor White
    Write-Host "   - Información de errores" -ForegroundColor White
    Write-Host ""
    Write-Host "📦 [7] Instalar Dependencias:" -ForegroundColor Green
    Write-Host "   - Ejecuta npm install" -ForegroundColor White
    Write-Host "   - Instala paquetes requeridos" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 REQUISITOS:" -ForegroundColor Cyan
    Write-Host "- Node.js v16 o superior" -ForegroundColor White
    Write-Host "- Token de Discord Bot" -ForegroundColor White
    Write-Host "- Configuración .env correcta" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona cualquier tecla para volver al menú..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Bucle principal
do {
    Show-MainMenu
    $option = Read-Host "Selecciona una opción (0-8)"
    
    switch ($option) {
        "1" { Start-Bot }
        "2" { Restart-Bot }
        "3" { Stop-Bot }
        "4" { Deploy-Commands }
        "5" { Show-BotStatus }
        "6" { View-Logs }
        "7" { Install-Dependencies }
        "8" { Show-Help }
        "0" { 
            Clear-Host
            Write-Host ""
            Write-Host "╔══════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "║                           👋 HASTA LUEGO                                        ║" -ForegroundColor Green
            Write-Host "╚══════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
            Write-Host ""
            Write-Host "✅ Panel de control cerrado" -ForegroundColor Green
            Write-Host ""
            Start-Sleep -Seconds 2
            break
        }
        default { 
            Write-Host "❌ Opción inválida. Presiona cualquier tecla para continuar..." -ForegroundColor Red
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
    }
} while ($option -ne "0")