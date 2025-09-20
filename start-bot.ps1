# Discord Music Bot Launcher
# Configuración de la ventana
$host.UI.RawUI.WindowTitle = "Discord Music Bot - RorsBot"
$host.UI.RawUI.BackgroundColor = "Black"
$host.UI.RawUI.ForegroundColor = "Green"

# Banner
Clear-Host
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      DISCORD MUSIC BOT - RORSBOT" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎵 Bot de música para Discord" -ForegroundColor Green
Write-Host "🎧 Soporta Spotify y YouTube" -ForegroundColor Green
Write-Host "🔥 Sistema híbrido de reproducción" -ForegroundColor Green
Write-Host ""

# Verificar que Node.js esté instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "   Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Cambiar al directorio del script
Set-Location $PSScriptRoot

# Verificar archivos necesarios
if (-not (Test-Path "index.js")) {
    Write-Host "❌ Error: No se encontró index.js" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Advertencia: No se encontró archivo .env" -ForegroundColor Yellow
    Write-Host "   Asegúrate de configurar las credenciales del bot" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Iniciando bot..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar el bot
try {
    node index.js
} catch {
    Write-Host ""
    Write-Host "❌ Error al ejecutar el bot" -ForegroundColor Red
    Write-Host "Detalles del error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🛑 Bot detenido" -ForegroundColor Yellow
Read-Host "Presiona Enter para cerrar"