@echo off
cd /d "%~dp0"
npm run editor -- --open
if errorlevel 1 pause
