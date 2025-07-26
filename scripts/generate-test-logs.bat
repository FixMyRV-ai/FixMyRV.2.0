@echo off
REM Quick batch script to generate Twilio test logs
echo Generating 15 random Twilio test messages...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0generate-twilio-test-logs.ps1" -Count 15
pause
