@echo off
echo ============================================
echo    FixMyRV - Postman Collection Setup
echo ============================================
echo.
echo Opening Postman collection files...
echo.

REM Check if Postman is installed and try to open the collection
echo 1. Import this file into Postman:
echo    %~dp0FixMyRV-Twilio-Postman-Collection.json
echo.
echo 2. Import this environment file:
echo    %~dp0FixMyRV-Development-Environment.postman_environment.json
echo.
echo 3. Select "FixMyRV - Development Environment" in Postman
echo.
echo 4. Run the "Health Check" request first to verify backend
echo.

REM Try to open file explorer to the current directory
start "" "%~dp0"

echo Files are ready in the opened folder!
echo.
echo ============================================
echo  Postman Collection Features:
echo ============================================
echo  ✓ Health Check endpoint
echo  ✓ Simple test format (JSON)
echo  ✓ Full realistic Twilio format
echo  ✓ Real webhook simulation (form-encoded)
echo  ✓ Emergency scenarios
echo  ✓ Geographic data testing
echo  ✓ Auto-generated MessageSids
echo  ✓ Response validation tests
echo ============================================
echo.
echo Next Steps:
echo 1. Open Postman
echo 2. Import the collection JSON file
echo 3. Import the environment JSON file
echo 4. Start testing your Twilio endpoints!
echo.
echo For detailed instructions, see README-Postman.md
echo.
pause
