# Investigação: protocolo Prix puro (sem depender do MGV7)

Ver `docs/prix-toledo-investigation.md` (raiz do repo) para o histórico completo.
Esta pasta guarda as ferramentas de investigação em andamento — que ficariam
perdidas se salvas só no scratchpad temporário da sessão do Claude.

## Status atual (pausado — falta balança online para continuar)

**Objetivo desta fase:** eliminar a dependência do software MGV7 da Toledo,
falando TCP puro com a balança Prix (como já fazemos com a Ramuza em
`agent-local/src/scale-client.ts`).

**Por que:** o `PrixDriver.exe` (pasta `..\`) funciona mas exige MGV7 instalado +
SQL Server local + item já cadastrado no banco do MGV7 — uma dependência de
implantação pesada que o time decidiu tentar remover, mesmo sabendo que a chance
de sucesso é incerta (~35% na avaliação feita durante a investigação).

**Onde paramos:** identificamos a classe de protocolo real usada internamente
pela Toledo — `Toledo.Componentes.PPrix` (em `TBR.Componentes.dll`) — com um
método público `PreparaMensagem(PPrixDataEnvio) -> List<byte[]>`.

`PPrixDataEnvio` tem os campos: `Endereco_Origem`, `Endereco_Destino`, `Opcode`
(1 byte), `Versao`, `Mensagem` (byte[] — o payload real, ainda não decifrado
seu formato), `TotalFragmentos`, `FragmentoAtual`, `TamanhoFragmento`.

`PPrix` só cuida do transporte/framing (STX/opcode/DLE-stuffing/DLE-ETX/checksum
— já mapeado, ver doc principal). **O que falta descobrir é o conteúdo real do
`Mensagem`** para um comando de atualização de preço/PLU — isso não foi
observado ainda.

## `CaptureBytes.cs` — ferramenta pronta, não executada ainda

Este arquivo (nesta pasta) é uma cópia do driver `PrixDriver` já validado
(`..\Program.cs`), mas com hooks adicionais nos eventos de baixo nível do
`Periferico` (`OnEnvioMensagem`, `OnDadosProntos`, `onDadoEnviado`) e, se
disponível nesse ponto, no protocolo `PPrix` real (`OnDadosPPrixProntos`) —
imprime em hexdump **todo byte bruto** que passa pela rede durante uma
transmissão real disparada via MGV7 (o mesmo fluxo do `PrixDriver`, só que
"espionando" o tráfego em vez de confiar cegamente no resultado).

**Ainda não foi executado contra a balança real** — ela estava fora da rede
quando a investigação foi pausada.

### Como compilar e rodar (quando a balança estiver online de novo)

1. Confirme que `..\lib\` tem as DLLs da Toledo copiadas (ver `..\lib\README.md`).
2. Compile:
   ```powershell
   $csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
   & $csc /nologo /platform:x86 /out:CaptureBytes.exe `
       /reference:"..\lib\TBR.MGV.Comunicacao.dll" `
       /reference:"..\lib\TBR.MGV.Comuns.dll" `
       /reference:"..\lib\TBR.Componentes.dll" `
       CaptureBytes.cs
   Copy-Item "..\lib\*.dll" -Destination . -Force
   ```
3. Confirme que a balança está acessível: `Test-NetConnection -ComputerName 10.10.40.37 -Port 9000`
4. Rode `.\CaptureBytes.exe` e capture toda a saída (redirecione para um arquivo
   — o volume de log é grande). Ele dispara uma transmissão real pro item
   `codigoBalanca=1, codigoItem=1` (o mesmo "Queijo" de teste) usando o preço que
   já estiver salvo em `MGV7_0001.tbItens` no momento — **mude o preço antes via
   SQL** (`UPDATE tbItens SET ITN_PRECO = 25.00 WHERE ITN_CODIGO = 1`) para poder
   comparar payloads com preços diferentes.

### Próximos passos depois de capturar

1. **Repetir a captura com pelo menos 2-3 preços diferentes** (ex: 15,00 / 25,00
   / 99,90) e nomes diferentes, salvando cada saída em arquivo separado.
2. **Comparar os payloads byte a byte** entre capturas — se o formato NÃO for
   criptografado, os bytes que mudam entre uma captura e outra (holding
   tudo mais igual) devem corresponder ao campo de preço, revelando o
   formato de codificação (texto ASCII? BCD? inteiro binário? etc.), do
   mesmo jeito que foi feito para decifrar o protocolo da Ramuza
   (`agent-local/src/scale-client.ts` — ver comentários sobre "captura A/B").
3. **Se o payload continuar de alta entropia / não fizer sentido nem variando
   preço conhecido** → forte indício de que É criptografado de verdade, e essa
   linha de investigação (TCP puro sem MGV7) provavelmente não vale mais o
   esforço — nesse caso, voltar para a dependência do MGV7 (`PrixDriver.exe`,
   já 100% funcional) é o caminho pragmático.
4. **Se decifrado**, o próximo passo é reimplementar o framing (`PPrixDataEnvio`
   equivalente) + o formato do `Mensagem` decodificado em TypeScript puro no
   `agent-local`, analogamente a `scale-client.ts` da Ramuza, eliminando de vez
   a dependência do MGV7/SQL Server/DLLs da Toledo.
