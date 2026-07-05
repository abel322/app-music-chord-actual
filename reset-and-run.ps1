# Script para limpiar y ejecutar MusicChord

Write-Host "🧹 Limpiando caché de Next.js..." -ForegroundColor Yellow

# Eliminar .next si existe
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Carpeta .next eliminada" -ForegroundColor Green
}

# Eliminar caché de node_modules si existe
if (Test-Path node_modules/.cache) {
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "✅ Caché de node_modules eliminada" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar npm run dev
npm run dev
