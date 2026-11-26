@echo off
chcp 65001 >nul
echo =================================================================
echo   CAPYHUB — CAP NHAT MAX SKILLS MOI NHAT TU GITHUB (BAO TOAN TRI NHO)
echo =================================================================
cd /d "%~dp0"
git pull origin main
node scripts/validate-harness-plugin.mjs
echo.
echo Da cap nhat xong! Ho so tri nho ca nhan trong 03_HoSo_TriNho_CaNhan/ van duoc giu nguyen 100%%.
pause
