@echo off
rem Create a daily 02:00 Windows scheduled task that backs up the PTC database.
rem Right-click this file and choose "Run as administrator".
rem If XAMPP is not in C:\xampp, edit the PHP path below.
set PHP=C:\xampp\php\php.exe
set SCRIPT=%~dp0api\cron_backup.php
schtasks /create /tn "PTC Backup" /tr "\"%PHP%\" \"%SCRIPT%\"" /sc daily /st 02:00 /f
echo.
echo To test now: schtasks /run /tn "PTC Backup"
pause
