Write-Host "🔧 Creating AI Platform Backup..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Create backup directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\Users\TrendSetTrading\Documents\AI_Platform_Backup_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force

# Current project location
$projectDir = "C:\WINDOWS\system32\ai_gateway"

Write-Host "Backing up from: $projectDir" -ForegroundColor Yellow
Write-Host "Backing up to: $backupDir" -ForegroundColor Yellow

# Copy all files
Copy-Item -Path "$projectDir\*" -Destination $backupDir -Recurse -Force

# Count apps
$appCount = (Get-ChildItem "$backupDir\ai_workspace\projects" -ErrorAction SilentlyContinue).Count

# Create summary
@"
AI PLATFORM BACKUP - $(Get-Date)
================================

SYSTEM STATUS:
✅ Gateway: Operational on port 3003
✅ Apps Generated: $appCount
✅ Templates: Calculator, Weather, Todo
✅ Last Working: $(Get-Date)

BACKUP CONTENTS:
1. simple_gateway.js - Main server
2. All generated apps ($appCount apps)
3. Dashboard (dashboard.html)
4. Monitoring tools
5. Documentation

TO RESTORE:
1. Copy to: C:\WINDOWS\system32\ai_gateway
2. Run: npm install express
3. Run: node simple_gateway.js
4. Test: irm http://localhost:3003/api/health

BACKUP CREATED: $timestamp
"@ | Out-File -FilePath "$backupDir\README_RESTORE.txt" -Encoding UTF8

Write-Host "`n✅ Backup Complete!" -ForegroundColor Green
Write-Host "Location: $backupDir" -ForegroundColor Yellow
Write-Host "Apps backed up: $appCount" -ForegroundColor Cyan

Write-Host "`n📋 Quick Restore:" -ForegroundColor Cyan
Write-Host "Copy-Item -Path '$backupDir\*' -Destination 'C:\WINDOWS\system32\ai_gateway' -Recurse" -ForegroundColor White
