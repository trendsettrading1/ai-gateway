# Icon Manager
$iconDir = "C:\AI_Ecosystem\Gateway\public\icons"
if (Test-Path $iconDir) {
    Get-ChildItem $iconDir -Filter "*.png" | Select Name
}
