# PesoHub Agent Local - instalador
# Roda na maquina do cliente, dentro da rede onde estao as balancas.
# Uso: clique com botao direito -> "Executar com PowerShell" (como Administrador)

$ErrorActionPreference = "Stop"

function Fail($msg) {
    Write-Host ""
    Write-Host "ERRO: $msg" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Fail "Este instalador precisa ser executado como Administrador (botao direito -> Executar como administrador)."
}

$InstallDir = "C:\PesoHub\agent-local"
$ServiceName = "PesoHubAgentLocal"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Instalador do PesoHub Agent Local ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Padrao de instalacao: UMA instancia deste agente por loja, rodando" -ForegroundColor Yellow
Write-Host "numa maquina que esteja na MESMA REDE FISICA das balancas (mesmo" -ForegroundColor Yellow
Write-Host "dominio de broadcast). Ele descobre as balancas sozinho via UDP -" -ForegroundColor Yellow
Write-Host "nao e necessario informar o IP de cada balanca aqui." -ForegroundColor Yellow
Write-Host ""
Write-Host "Se a loja tiver mais de uma rede/VLAN com balancas, e necessaria" -ForegroundColor Yellow
Write-Host "uma instalacao por rede (broadcast UDP nao atravessa VLANs)." -ForegroundColor Yellow
Write-Host ""

# ---- coleta de configuracao ----
$BackendUrl = Read-Host "URL do backend PesoHub (ex: https://api.pesohub.com.br)"
if ([string]::IsNullOrWhiteSpace($BackendUrl)) { Fail "URL do backend e obrigatoria." }

$AgentToken = Read-Host "Token do agente (fornecido pelo PesoHub para esta loja)"
if ([string]::IsNullOrWhiteSpace($AgentToken)) { Fail "Token do agente e obrigatorio." }

$DiscoveryPort = Read-Host "Porta de descoberta UDP das balancas [ENTER para usar padrao 33584]"
if ([string]::IsNullOrWhiteSpace($DiscoveryPort)) { $DiscoveryPort = "33584" }

# ---- copia dos arquivos ----
Write-Host ""
Write-Host "Instalando em $InstallDir ..."
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

Copy-Item -Path (Join-Path $ScriptDir "bin\agent-local.exe") -Destination (Join-Path $InstallDir "agent-local.exe") -Force
Copy-Item -Path (Join-Path $ScriptDir "bin\nssm.exe") -Destination (Join-Path $InstallDir "nssm.exe") -Force

$envContent = @"
AGENT_BACKEND_URL=$BackendUrl
AGENT_TOKEN=$AgentToken
SCALE_DISCOVERY_PORT=$DiscoveryPort
"@
Set-Content -Path (Join-Path $InstallDir ".env") -Value $envContent -Encoding UTF8

# ---- registro como servico Windows (via NSSM) ----
$nssm = Join-Path $InstallDir "nssm.exe"
$exe = Join-Path $InstallDir "agent-local.exe"
$logOut = Join-Path $InstallDir "agent-local.out.log"
$logErr = Join-Path $InstallDir "agent-local.err.log"

$existing = & $nssm status $ServiceName 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Servico ja existe, removendo versao anterior..."
    & $nssm stop $ServiceName 2>$null | Out-Null
    & $nssm remove $ServiceName confirm 2>$null | Out-Null
}

Write-Host "Registrando servico do Windows ($ServiceName)..."
& $nssm install $ServiceName $exe
& $nssm set $ServiceName AppDirectory $InstallDir
& $nssm set $ServiceName AppStdout $logOut
& $nssm set $ServiceName AppStderr $logErr
& $nssm set $ServiceName AppRotateFiles 1
& $nssm set $ServiceName AppRotateBytes 1048576
& $nssm set $ServiceName Start SERVICE_AUTO_START
& $nssm set $ServiceName DisplayName "PesoHub Agent Local"
& $nssm set $ServiceName Description "Ponte entre as balancas da loja e o PesoHub. Nao remover."

Write-Host "Iniciando servico..."
& $nssm start $ServiceName | Out-Null
Start-Sleep -Seconds 2

$status = & $nssm status $ServiceName
Write-Host ""
if ($status -match "SERVICE_RUNNING") {
    Write-Host "Servico instalado e rodando com sucesso." -ForegroundColor Green
} else {
    Write-Host "Servico instalado, mas status atual e: $status" -ForegroundColor Yellow
    Write-Host "Verifique o log em: $logErr"
}

Write-Host ""
Write-Host "Instalacao concluida."
Write-Host "Pasta de instalacao: $InstallDir"
Write-Host ""
Write-Host "Proximo passo: no painel PesoHub, va em Balancas -> 'Buscar na Rede'" -ForegroundColor Cyan
Write-Host "para ver e vincular as balancas que este agente encontrou na rede da loja." -ForegroundColor Cyan
Write-Host ""
Write-Host "Para reconfigurar, edite $InstallDir\.env e reinicie o servico com:"
Write-Host "  $nssm restart $ServiceName"
Write-Host ""
Read-Host "Pressione ENTER para sair"
