$ErrorActionPreference = 'Stop'
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$wpfDir = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF"
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$hubRoot = Split-Path -Parent $appDir
$icoPath = Join-Path $appDir "CapybaraHub.ico"
$previewPngPath = Join-Path (Join-Path $hubRoot "test-results") "capy-icon-preview.png"
$iconGenExe = Join-Path $env:TEMP ("CapyIconMaker_" + [Guid]::NewGuid().ToString("N").Substring(0, 8) + ".exe")
$outExe = Join-Path $hubRoot "Capybara-Hub.exe"

Write-Host "1. Bien dich CapyIconMaker & xuat CapybaraHub.ico..." -ForegroundColor Cyan
& $csc /nologo /codepage:65001 /target:exe /out:$iconGenExe /r:System.Drawing.dll (Join-Path $appDir "CapyIconMaker.cs")
if ($LASTEXITCODE -ne 0) { throw "CapyIconMaker compile failed!" }

& $iconGenExe $icoPath --png $previewPngPath
Remove-Item $iconGenExe -Force -ErrorAction SilentlyContinue

Get-Process -Name "Capybara-Hub" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "2. Bien dich Capybara-Hub.exe (Native Windows Desktop App - 0 Dependency)..." -ForegroundColor Cyan
& $csc /nologo /codepage:65001 /target:winexe /optimize+ `
  /win32icon:$icoPath `
  /out:$outExe `
  /r:"$wpfDir\PresentationFramework.dll" `
  /r:"$wpfDir\PresentationCore.dll" `
  /r:"$wpfDir\WindowsBase.dll" `
  /r:System.Xaml.dll `
  (Join-Path $appDir "CapyHubModels.cs") `
  (Join-Path $appDir "CapyWorkflowView.cs") `
  (Join-Path $appDir "CapyMainWindow.cs")
if ($LASTEXITCODE -ne 0) { throw "Capybara-Hub.exe compile failed!" }

Write-Host "3. Tao Shortcut 'Capybara AI Hub' tren Desktop cua may..." -ForegroundColor Cyan
$wsh = New-Object -ComObject WScript.Shell
$desktopDirs = @(
  [Environment]::GetFolderPath("Desktop"),
  (Join-Path $env:USERPROFILE "OneDrive\Desktop")
)
foreach ($d in $desktopDirs) {
  if (Test-Path $d) {
    $lnkPath = Join-Path $d "Capybara AI Hub.lnk"
    $sc = $wsh.CreateShortcut($lnkPath)
    $sc.TargetPath = $outExe
    $sc.WorkingDirectory = $hubRoot
    $sc.IconLocation = "$icoPath,0"
    $sc.Description = "Capybara AI Hub - Tram Dieu Phoi Mic, Confirm Ket Qua Cuoi & QA Lien Tuc"
    $sc.Save()
    Write-Host "   -> Da tao Desktop Shortcut: $lnkPath" -ForegroundColor Green
  }
}

Write-Host "HOAN TAT 100%: $outExe" -ForegroundColor Green
