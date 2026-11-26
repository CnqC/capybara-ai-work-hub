@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "%~dp0Capybara-Hub.exe" (
    powershell -ExecutionPolicy Bypass -File "%~dp0launcher-app\build-capy-hub.ps1"
)
start "" "%~dp0Capybara-Hub.exe"
