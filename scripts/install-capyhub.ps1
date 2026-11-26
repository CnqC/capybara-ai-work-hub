# ==============================================================================
# CAPYHUB 1-CLICK INSTALLER (Gắn Plugin + Tạo Hồ Sơ Trí Nhớ Cá Nhân Không Ghi Đè)
# ==============================================================================
$ErrorActionPreference = "Stop"
$HubRoot = Split-Path -Parent $PSScriptRoot
$PluginSource = Join-Path $HubRoot ".harness-plugin"
$TargetPluginsDir = Join-Path $env:USERPROFILE ".gemini\config\plugins"
$TargetLink = Join-Path $TargetPluginsDir "capybara-work-harness"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  CAPYHUB — CAI DAT TRAM DIEU PHOI AI CA NHAN HOA (GOOGLE AI ULTRA)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

if (-not (Test-Path $TargetPluginsDir)) {
    New-Item -ItemType Directory -Force -Path $TargetPluginsDir | Out-Null
}

if (Test-Path $TargetLink) {
    Write-Host "[1/3] Plugin capybara-work-harness da duoc gan san tai: $TargetLink" -ForegroundColor Green
} else {
    New-Item -ItemType Junction -Path $TargetLink -Target $PluginSource | Out-Null
    Write-Host "[1/3] Da gan Directory Junction (.harness-plugin -> $TargetLink) thanh cong!" -ForegroundColor Green
}

$MemoryDir = Join-Path $HubRoot "03_HoSo_TriNho_CaNhan"
$Templates = @(
    @{ Tpl = "USER-STYLE-DNA.template.md"; Dest = "USER-STYLE-DNA.md" },
    @{ Tpl = "VOICE-GLOSSARY.template.md"; Dest = "VOICE-GLOSSARY.md" },
    @{ Tpl = "LESSONS-LEARNED.template.md"; Dest = "LESSONS-LEARNED.md" }
)

foreach ($item in $Templates) {
    $srcPath = Join-Path $MemoryDir $item.Tpl
    $dstPath = Join-Path $MemoryDir $item.Dest
    if (-not (Test-Path $dstPath)) {
        Copy-Item $srcPath $dstPath
        Write-Host "[2/3] Da khoi tao ho so tri nho ca nhan: $($item.Dest)" -ForegroundColor Yellow
    } else {
        Write-Host "[2/3] Giu nguyen ho so tri nho ca nhan hien co: $($item.Dest)" -ForegroundColor Green
    }
}

Write-Host "[3/3] Kiem tra va cai dat thu vien giao dien CapyHub..." -ForegroundColor Cyan
Push-Location $HubRoot
npm install
npm run doctor
Pop-Location

Write-Host "`nHOAN TAT 100%! Hay chay '3-Mo-CapyHub-Va-App-Tai-Chinh.bat' hoac mo Antigravity / Gemini CLI!" -ForegroundColor Green
