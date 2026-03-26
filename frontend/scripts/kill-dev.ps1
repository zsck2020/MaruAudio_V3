# Kill previous MaruAudio dev processes before starting new ones
# Uses Invoke-CimMethod which works without admin elevation

$ErrorActionPreference = 'SilentlyContinue'

# 1. Kill Tauri app and cargo processes
Get-CimInstance Win32_Process -Filter "Name='maruaudio_v3.exe'" | Invoke-CimMethod -MethodName Terminate 2>$null
Get-CimInstance Win32_Process -Filter "Name='cargo.exe'" | Invoke-CimMethod -MethodName Terminate 2>$null

# 2. Kill node processes occupying dev ports (1420 = Vite, 1421 = HMR)
foreach ($port in @(1420, 1421)) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $procId = $conn.OwningProcess
        if ($procId -and $procId -gt 0) {
            Get-CimInstance Win32_Process -Filter "ProcessId=$procId" | Invoke-CimMethod -MethodName Terminate 2>$null
        }
    }
}

Write-Host "[cleanup] Dev processes cleaned" -ForegroundColor Green
