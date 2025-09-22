# Discord Music Bot - Auto Restart Script
# Mantiene el bot ejecutándose y lo reinicia automáticamente

Write-Host "🤖 Discord Music Bot con Auto-Reinicio" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] 🚀 Iniciando bot..." -ForegroundColor Green
    
    # Ejecutar el bot
    $process = Start-Process -FilePath "node" -ArgumentList "index.js" -Wait -PassThru -NoNewWindow
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host ""
    Write-Host "[$timestamp] ⚠️ Bot desconectado (Código: $($process.ExitCode))" -ForegroundColor Yellow
    
    # Si el código de salida es 0, fue un reinicio intencional
    if ($process.ExitCode -eq 0) {
        Write-Host "[$timestamp] 🔄 Reinicio solicitado. Reiniciando en 3 segundos..." -ForegroundColor Blue
    } else {
        Write-Host "[$timestamp] ❌ Bot cerrado inesperadamente. Reiniciando en 5 segundos..." -ForegroundColor Red
        Start-Sleep -Seconds 2
    }
    
    Start-Sleep -Seconds 3
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] 🔄 Reiniciando..." -ForegroundColor Cyan
    Write-Host ""
}