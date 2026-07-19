# PesoHub Agent Local - desinstalador
# Uso: clique com botao direito -> "Executar com PowerShell" (como Administrador)

$ErrorActionPreference = "Stop"
$InstallDir = "C:\PesoHub\agent-local"
$ServiceName = "PesoHubAgentLocal"

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERRO: execute como Administrador." -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

$nssm = Join-Path $InstallDir "nssm.exe"
if (Test-Path $nssm) {
    Write-Host "Parando e removendo servico..."
    & $nssm stop $ServiceName 2>$null | Out-Null
    & $nssm remove $ServiceName confirm 2>$null | Out-Null
} else {
    sc.exe stop $ServiceName 2>$null | Out-Null
    sc.exe delete $ServiceName 2>$null | Out-Null
}

$remove = Read-Host "Remover tambem a pasta $InstallDir (arquivos e .env)? [s/N]"
if ($remove -eq "s" -or $remove -eq "S") {
    Remove-Item -Recurse -Force $InstallDir -ErrorAction SilentlyContinue
    Write-Host "Pasta removida."
}

Write-Host "Desinstalacao concluida." -ForegroundColor Green
Read-Host "Pressione ENTER para sair"
