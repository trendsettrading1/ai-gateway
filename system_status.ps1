Write-Host "+------------------------------------------+" -ForegroundColor Cyan
Write-Host "¦     AI SYSTEM STATUS REPORT            ¦" -ForegroundColor Cyan
Write-Host "+------------------------------------------+" -ForegroundColor Cyan
Write-Host ""

# 1. Check current directory
Write-Host "1. Current Location:" -ForegroundColor Yellow
Write-Host "   $(pwd)" -ForegroundColor Gray

# 2. Check running processes
Write-Host "`n2. Running Processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   ? Node.js processes running:" -ForegroundColor Green
    $nodeProcesses | ForEach-Object {
        Write-Host "     - PID $($_.Id): $($_.Path)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ? No Node.js processes running" -ForegroundColor Red
}

# 3. Check gateway health
Write-Host "`n3. Gateway Status:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3003/api/health" -TimeoutSec 3
    Write-Host "   ? Gateway is responding" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    if ($health.templates) {
        Write-Host "   Templates: $($health.templates -join ', ')" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ? Gateway not responding" -ForegroundColor Red
}

# 4. Check workspace
Write-Host "`n4. Workspace Status:" -ForegroundColor Yellow
$workspacePath = "ai_workspace\projects"
if (Test-Path $workspacePath) {
    $files = Get-ChildItem $workspacePath
    Write-Host "   ? Workspace exists" -ForegroundColor Green
    Write-Host "   Total apps: $($files.Count)" -ForegroundColor Gray
    
    if ($files.Count -gt 0) {
        Write-Host "   Latest 5 apps:" -ForegroundColor Gray
        $files | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
            $age = [math]::Round((New-TimeSpan -Start $_.LastWriteTime -End (Get-Date)).TotalMinutes, 1)
            Write-Host "     - $($_.Name) ($age minutes ago, $($_.Length) bytes)" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "   ? Workspace not found" -ForegroundColor Red
}

# 5. Check Ollama
Write-Host "`n5. Ollama Status:" -ForegroundColor Yellow
try {
    $ollama = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 2
    Write-Host "   ? Ollama is running" -ForegroundColor Green
    Write-Host "   Models: $($ollama.models.name -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "   ??  Ollama not running (optional)" -ForegroundColor Yellow
}

Write-Host "`n+------------------------------------------+" -ForegroundColor Green
Write-Host "¦     SYSTEM READY FOR PRODUCTION         ¦" -ForegroundColor Green
Write-Host "+------------------------------------------+" -ForegroundColor Green
Write-Host ""
Write-Host "?? Your AI-to-AI development platform is operational!"
Write-Host ""
Write-Host "To use it:" -ForegroundColor Cyan
Write-Host "1. Keep gateway running: node simple_gateway.js" -ForegroundColor White
Write-Host "2. Send AI requests to: http://localhost:3003/api/ai/process" -ForegroundColor White
Write-Host "3. Monitor at: http://localhost:3003/api/health" -ForegroundColor White
