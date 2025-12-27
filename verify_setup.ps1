Write-Host "🔍 VERIFYING SETUP" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# 1. Check current directory
Write-Host "1. Current directory: $(Get-Location)" -ForegroundColor Yellow

# 2. Check if files exist
Write-Host "`n2. Checking gateway files:" -ForegroundColor Yellow
$files = @("simple_gateway_fixed.js", "ultra_simple_gateway.js", "simple_gateway.js")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NOT found" -ForegroundColor Red
    }
}

# 3. Check Express installation
Write-Host "`n3. Checking Express:" -ForegroundColor Yellow
if (Test-Path "node_modules\express") {
    Write-Host "   ✅ Express is installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Express NOT installed" -ForegroundColor Red
    Write-Host "   Run: npm install express" -ForegroundColor Yellow
}

# 4. Check running processes
Write-Host "`n4. Running Node processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   ✅ Node is running ($($nodeProcesses.Count) processes)" -ForegroundColor Green
    $nodeProcesses | Select-Object Id, ProcessName
} else {
    Write-Host "   ℹ️ No Node processes running" -ForegroundColor Yellow
}

# 5. Check port 3003
Write-Host "`n5. Port 3003 status:" -ForegroundColor Yellow
$portCheck = netstat -an | Select-String ":3003"
if ($portCheck) {
    Write-Host "   ✅ Port 3003 is in use" -ForegroundColor Green
    $portCheck
} else {
    Write-Host "   ❌ Port 3003 is NOT in use" -ForegroundColor Red
    Write-Host "   Gateway is not running!" -ForegroundColor Red
}

Write-Host "`n🎯 VERIFICATION COMPLETE" -ForegroundColor Cyan
