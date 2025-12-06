# Script para agregar rutaId a todos los archivos
# Ejecutar: .\apply-rutaid-fixes.ps1

Write-Host "Aplicando correcciones de rutaId..." -ForegroundColor Green

# Función para agregar rutaId después de tenantId
function Add-RutaId {
    param($file, $pattern, $replacement)
    
    $content = Get-Content $file -Raw
    $newContent = $content -replace $pattern, $replacement
    Set-Content $file $newContent -NoNewline
    Write-Host "✓ Corregido: $file" -ForegroundColor Cyan
}

# Corregir calculos.test.ts
$file = "src/lib/calculos.test.ts"
$content = Get-Content $file -Raw
$content = $content -replace "tenantId: 'test-tenant',", "tenantId: 'test-tenant',`n    rutaId: 'test-ruta',`n    cobradorId: 'test-cobrador',"
Set-Content $file $content -NoNewline
Write-Host "✓ Corregido: $file" -ForegroundColor Cyan

# Corregir seedData.ts - clientes
$file = "src/lib/seedData.ts"
$content = Get-Content $file -Raw
$content = $content -replace "tenantId: tenantId,(\s+)nombre:", "tenantId: tenantId,`n      rutaId: 'ruta-default',`$1nombre:"
Set-Content $file $content -NoNewline
Write-Host "✓ Corregido: $file (clientes)" -ForegroundColor Cyan

# Corregir seedData.ts - créditos
$content = Get-Content $file -Raw
$content = $content -replace "tenantId: tenantId,(\s+)clienteId:", "tenantId: tenantId,`n      rutaId: 'ruta-default',`$1clienteId:"
Set-Content $file $content -NoNewline
Write-Host "✓ Corregido: $file (créditos)" -ForegroundColor Cyan

# Corregir seedData.ts - cuotas
$content = Get-Content $file -Raw
$content = $content -replace "tenantId: tenantId,(\s+)creditoId:", "tenantId: tenantId,`n        rutaId: 'ruta-default',`$1creditoId:"
$content = $content -replace "clienteId: clienteId,(\s+)numero:", "clienteId: clienteId,`n        cobradorId: userId,`$1numero:"
Set-Content $file $content -NoNewline
Write-Host "✓ Corregido: $file (cuotas)" -ForegroundColor Cyan

Write-Host "`n✅ Todas las correcciones aplicadas!" -ForegroundColor Green
Write-Host "Ejecuta 'npm run build' para verificar" -ForegroundColor Yellow
