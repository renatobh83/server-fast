$tunnelCmd = "ssh -p 2290 -f -N -L 6432:localhost:6432 login@109.199.105.36"
$process = Get-Process ssh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$tunnelCmd*" }

if (!$process) {
  Write-Host "Criando novo túnel SSH..."
  Invoke-Expression $tunnelCmd
  if ($LASTEXITCODE -eq 0) {
    $newProcess = Get-Process ssh | Where-Object { $_.CommandLine -like "*$tunnelCmd*" }
    Write-Host "Túnel criado com sucesso! PID: $($newProcess.Id)"
  } else {
    Write-Host "Erro ao criar túnel!"
    exit 1
  }
} else {
  Write-Host "Túnel já está ativo (PID: $($process.Id))"
}