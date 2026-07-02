<#
.SYNOPSIS
  Sets up a weekly scheduled task to refresh surveillance map data.

.DESCRIPTION
  Run this script once (as Administrator) to register a task that runs
  every Monday at 8:00 AM. It executes update-surveillance.bat from the
  project scripts folder.

  Usage:
    PowerShell -ExecutionPolicy Bypass -File setup-windows-task.ps1

  Prerequisites:
    - Node.js installed and on PATH
    - The ellis project at %USERPROFILE%\Desktop\Dev\ellis
#>

$ProjectDir = "$env:USERPROFILE\Desktop\Dev\ellis"
$TaskName = "Ellis-SurveillanceUpdate"
$BatPath = "$ProjectDir\scripts\update-surveillance.bat"
$LogFile = "$env:TEMP\ellis-update.log"

if (!(Test-Path $ProjectDir)) {
    Write-Error "Project directory not found: $ProjectDir"
    exit 1
}

# Unregister if exists
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task '$TaskName'"
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$BatPath`" >> `"$LogFile`" 2>&1"
$trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek Monday -At 08:00
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

Write-Host "Scheduled task '$TaskName' created: every Monday at 8:00 AM"
Write-Host "Logs: $LogFile"
