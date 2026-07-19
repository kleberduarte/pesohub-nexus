# Compila o PrixDriver.exe usando csc.exe (.NET Framework 4.8, x86).
# Pre-requisito: copiar as DLLs da Toledo para .\lib\ antes de rodar (ver lib/README.md).

$ErrorActionPreference = "Stop"
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$libDir = Join-Path $PSScriptRoot "lib"
$outDir = Join-Path $PSScriptRoot "bin"

if (-not (Test-Path (Join-Path $libDir "TBR.MGV.Comunicacao.dll"))) {
    Write-Error "DLLs da Toledo nao encontradas em $libDir - veja lib/README.md antes de compilar."
    exit 1
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

& $csc /nologo /platform:x86 /out:"$outDir\PrixDriver.exe" `
    /reference:"$libDir\TBR.MGV.Comunicacao.dll" `
    /reference:"$libDir\TBR.MGV.Comuns.dll" `
    /reference:"$libDir\TBR.Componentes.dll" `
    /reference:System.Data.dll `
    "$PSScriptRoot\Program.cs"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha na compilacao."
    exit 1
}

Copy-Item "$libDir\*.dll" -Destination $outDir -Force

Write-Output "OK: $outDir\PrixDriver.exe"
