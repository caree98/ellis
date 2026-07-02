@echo off
REM update-surveillance.bat — Windows batch script for weekly data refresh
REM Run via Scheduled Task: every Monday at 8:00 AM

cd /d "%~dp0.."

echo [%date% %time%] fetching fresh data...
node scripts\fetch-data.js

echo [%date% %time%] rebuilding embedded map data...
node scripts\rebuild-embedded.js

echo [%date% %time%] done.
