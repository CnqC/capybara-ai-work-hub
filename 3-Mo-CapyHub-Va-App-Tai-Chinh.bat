@echo off
chcp 65001 >nul
echo =================================================================
echo   KHOI DONG CAPYHUB DASHBOARD VA PHAN MEM QUAN LY TAI CHINH CA NHAN
echo =================================================================
cd /d "%~dp0"
start "" "http://localhost:5173"
npx vite --port 5173 --host
