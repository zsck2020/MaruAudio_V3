$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot
& 'C:\Users\26525\AppData\Roaming\npm\codex.cmd' '--dangerously-bypass-approvals-and-sandbox' '--cd' $repoRoot @args
