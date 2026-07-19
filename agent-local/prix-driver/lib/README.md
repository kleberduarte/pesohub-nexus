# DLLs da Toledo (não versionadas)

Esta pasta é ignorada pelo git (`.gitignore`) — as DLLs aqui são proprietárias do
software MGV7 da Toledo do Brasil, não redistribuídas neste repositório.

## Como preparar

Na máquina onde o Agent Local vai rodar (precisa ter o **MGV7 da Toledo instalado**,
já que é de lá que vêm essas DLLs), copie **todos** os `.dll` de:

```
C:\Program Files (x86)\Toledo do Brasil\MGV 7\
```

para esta pasta (`agent-local/prix-driver/lib/`). Copiar todos (não só as 3
referenciadas em `build.ps1`) evita erros de dependência transitiva faltando em
tempo de execução — o custo é só espaço em disco.

Exemplo (PowerShell, como Administrador não é necessário):
```powershell
Copy-Item "C:\Program Files (x86)\Toledo do Brasil\MGV 7\*.dll" -Destination . -Force
```

## DLLs mínimas exigidas para compilar

- `TBR.MGV.Comunicacao.dll`
- `TBR.MGV.Comuns.dll`
- `TBR.Componentes.dll`

(as demais são resolvidas em tempo de execução via probing padrão do .NET, desde
que estejam na mesma pasta do `PrixDriver.exe` — o `build.ps1` já copia tudo pra
`bin/` automaticamente).

## Pré-requisitos da máquina

- MGV7 instalado (é de onde vêm as DLLs — reinstale/atualize lá se a versão mudar)
- SQL Server local com instância `SQL_MGV7` acessível via Windows Authentication
  (mesmo usuário que roda o Agent Local)
- .NET Framework 4.8 (as DLLs são 32-bit — `PrixDriver.exe` precisa compilar/rodar
  como x86, ver `build.ps1`)

Ver `docs/prix-toledo-investigation.md` (raiz do repo) para o histórico completo de
como esse driver foi descoberto e validado.
