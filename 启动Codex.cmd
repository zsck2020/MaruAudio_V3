@echo off
setlocal
cd /d "%~dp0"
call "C:\Users\26525\AppData\Roaming\npm\codex.cmd" --dangerously-bypass-approvals-and-sandbox --cd "%CD%" %*
