# Verifica PLU 700 e a tabela nutricional 1 direto na balança, sem precisar do repo.
# Uso: roda na maquina onde o agent-local esta instalado (a mesma rede da balanca).
# Precisa ser Administrador (pra parar/reiniciar o servico do agent, que segura a
# unica conexao TCP que a balanca aceita por vez).

param(
    # O IP da balanca e DHCP e muda sozinho. Passe outro se necessario:
#   powershell -ExecutionPolicy Bypass -File verificar-balanca.ps1 -ScaleIp 192.168.15.9
    [string]$ScaleIp = "192.168.15.4",
    [int]$ScalePort = 33581,
    [int]$PluNumero = 700,
    [string]$ServiceName = "PesoHubAgentLocal"
)

function Read-Scale($command, $endMarker) {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.ReceiveTimeout = 8000
    $client.Connect($ScaleIp, $ScalePort)
    $stream = $client.GetStream()
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($command)
    $stream.Write($bytes, 0, $bytes.Length)

    $buffer = New-Object byte[] 65536
    $all = ""
    $deadline = (Get-Date).AddSeconds(8)
    while ((Get-Date) -lt $deadline) {
        if ($stream.DataAvailable) {
            $read = $stream.Read($buffer, 0, $buffer.Length)
            if ($read -gt 0) {
                $all += [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)
                if ($all.Contains($endMarker)) { break }
            }
        } else {
            Start-Sleep -Milliseconds 100
        }
    }
    $client.Close()
    return $all
}

# A balanca aceita uma unica conexao TCP por vez, entao o agente precisa soltar
# a dele enquanto lemos. Numa maquina sem o agente instalado (suporte remoto,
# por exemplo) simplesmente nao ha o que parar.
$servico = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($servico) {
    Write-Host "Parando o servico $ServiceName (a balanca so aceita 1 conexao por vez)..." -ForegroundColor Cyan
    Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} else {
    Write-Host "Servico $ServiceName nao instalado nesta maquina - seguindo direto." -ForegroundColor DarkGray
}

Write-Host "`n=== PLU (produto $PluNumero) em $ScaleIp`:$ScalePort ===" -ForegroundColor Yellow
$plu = Read-Scale "UPL`tPLU`t`r`n" "END`tPLU"
$pluLines = @($plu -split "`r`n" | Where-Object { $_ -like ("PLU" + [char]9 + $PluNumero + [char]9 + "*") })
if ($pluLines.Count -gt 0) {
    # Indice = posicao depois de "PLU<TAB>", 1-based: campo[N] = idxN.
    $f = ([string]$pluLines[0]).Split([char]9)
    Write-Host "Encontrado ($($f.Count) campos):" -ForegroundColor Green
    Write-Host "  idx15 Nome                 : '$($f[15])'"
    Write-Host "  idx8  Etiqueta (LabelID1)  : '$($f[8])'"
    Write-Host "  idx59 Tabela nutricional   : '$($f[59])'"
    Write-Host "  idx19 Ingredientes         : '$($f[19])'"
    Write-Host ""
    # Diagnostico dos tres campos que decidem se a etiqueta sai completa.
    if ([string]::IsNullOrWhiteSpace($f[19])) {
        Write-Host "  AVISO: ingredientes vazios - a etiqueta vai sair sem eles." -ForegroundColor Yellow
    }
    if ($f[59] -eq "0" -or [string]::IsNullOrWhiteSpace($f[59])) {
        Write-Host "  AVISO: sem tabela nutricional vinculada." -ForegroundColor Yellow
    }
    if ($f[8] -eq "0" -or [string]::IsNullOrWhiteSpace($f[8])) {
        Write-Host "  AVISO: sem formato de etiqueta vinculado." -ForegroundColor Yellow
    }
    Write-Host "  Linha completa:" -ForegroundColor DarkGray
    Write-Host "  $($pluLines[0])" -ForegroundColor DarkGray
} else {
    Write-Host "PLU $PluNumero NAO encontrado na balanca." -ForegroundColor Red
}

Write-Host "`n=== NU3 (tabelas nutricionais gravadas) ===" -ForegroundColor Yellow
$nu3 = Read-Scale "UPL`tNU3`t`r`n" "END`tNU3"
$nu3Lines = @($nu3 -split "`r`n" | Where-Object { $_.StartsWith("NU3" + [char]9) })
if ($nu3Lines.Count -gt 0) {
    Write-Host "Encontrado:" -ForegroundColor Green
    $nu3Lines | ForEach-Object {
        $n = ([string]$_).Split([char]9)
        Write-Host ("  indice=$($n[1])  nome='$($n[2])'  ingredientes='$($n[3])'  valor energetico=$($n[7])")
    }
} else {
    Write-Host "Nenhuma tabela NU3 encontrada na balanca." -ForegroundColor Red
}

if ($servico) {
    Write-Host "`nReiniciando o servico $ServiceName..." -ForegroundColor Cyan
    Start-Service -Name $ServiceName -ErrorAction SilentlyContinue
}

Write-Host "`nPronto. Copie a saida acima e cole de volta na conversa." -ForegroundColor Cyan
