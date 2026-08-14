@echo off
REM Second Brain in a Box -- Windows entry point.
REM
REM Double-click this file. It runs the installer with the execution policy
REM bypassed for THIS PROCESS ONLY; nothing about the machine's policy is
REM changed. A .ps1 cannot be double-clicked directly -- Windows opens it in
REM Notepad -- which is the entire reason this shim exists.

setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*

if errorlevel 1 (
  echo.
  echo Setup did not finish. Read the messages above, then double-click this
  echo file again. Re-running is safe -- it skips anything already done.
  echo.
  pause
)

endlocal
