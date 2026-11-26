# ==============================================================================
# CAPYHUB 1-CLICK INSTALLER:
# 1. Biên dịch App Desktop Capybara-Hub.exe & Tạo Shortcut trên Desktop
# 2. Gắn Plugin .harness-plugin vào ~/.gemini/config/plugins/capybara-work-harness
# 3. Khởi tạo Hồ sơ Trí nhớ dài hạn (USER-STYLE-DNA.md & VOICE-GLOSSARY.md)
# ==============================================================================
$ErrorActionPreference = "Stop"
$HubRoot = Split-Path -Parent $PSScriptRoot
$PluginSource = Join-Path $HubRoot ".harness-plugin"
$TargetPluginsDir = Join-Path $env:USERPROFILE ".gemini\config\plugins"
$TargetLink = Join-Path $TargetPluginsDir "capybara-work-harness"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  CAPYBARA AI HUB — CAI DAT APP DESKTOP & HARNESS PLUGIN" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Build Capybara-Hub.exe & Desktop Shortcut
& (Join-Path $HubRoot "launcher-app\build-capy-hub.ps1")

# 2. Link .harness-plugin
if (-not (Test-Path $TargetPluginsDir)) {
    New-Item -ItemType Directory -Force -Path $TargetPluginsDir | Out-Null
}
if (-not (Test-Path $TargetLink)) {
    New-Item -ItemType Junction -Path $TargetLink -Target $PluginSource | Out-Null
    Write-Host "[Plugin] Da gan capybara-work-harness vao Google AI Ultra!" -ForegroundColor Green
}

# 3. Initialize personal memory templates
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
    }
}

# 4. Launch Capybara-Hub.exe
Start-Process (Join-Path $HubRoot "Capybara-Hub.exe")
