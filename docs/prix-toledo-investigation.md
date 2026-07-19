# Investigação: comunicação com balança Toledo Prix 5 Plus (V8.9)

Balança de teste: IP `10.10.40.37`, porta `9000`, MAC `00:1F:10:BA:F2:0D`, modelo Toledo
Prix 5 Plus (V8.9) — `TipoBalancaEnum.Prix5V89 = 40` (bate com `tbBalanca.TPB_CODIGO=40`
no banco do MGV7).

## Contexto

O agent-local do PesoHub já fala com balanças Ramuza/Atena (protocolo texto TXT-MODE,
ver `agent-local/src/scale-client.ts`). Esta investigação buscou o mesmo para a linha
Toledo Prix, cujo protocolo é binário e não documentado publicamente.

## O que foi tentado e descartado

- **Protocolo texto adivinhado** (ENQ, STATUS, STX/ETX vazio, etc.) — sem resposta.
- **Reuso do framing Ramuza** (`DWL/PLU...END/PLU...UPL/TIM`) — sem resposta.
- **Captura Wireshark** de uma transferência real feita pelo software oficial Toledo
  (LMP) confirmou framing binário: `STX(02) ... [DLE-stuffing] DLE ETX(10 03) + checksum`.
- **P/Invoke direto em `Cripto.dll`** (DLL nativa Delphi/Borland da Toledo, exporta
  `Criptografar`/`Descriptografar`) — todas as 7 combinações de assinatura testadas
  (stdcall/cdecl, PAnsiChar, buffer alocado pelo chamador) resultaram em
  `AccessViolationException`. Conclusão: a DLL usa a convenção de chamada nativa do
  Delphi (`register`), incompatível com P/Invoke do .NET.
- **Frida (hook dinâmico)** anexado no `LMPService.exe` e depois no `MGV7Central.exe`
  esperando `Cripto.dll` carregar — nunca carregou em nenhum dos dois processos.
  Confirma que o MGV7 usa a rota **gerenciada** (.NET), não a DLL nativa.

## Descobertas importantes (funcionando)

### 1. Software oficial instalado nesta máquina
- `C:\Program Files (x86)\Toledo do Brasil\LMP\` — software antigo (Delphi), usa
  `Cripto.dll` nativa. Processo: `LMPService.exe` (roda como serviço Windows,
  sessão `Services`).
- `C:\Program Files (x86)\Toledo do Brasil\MGV 7\` — software atual (.NET Framework
  4.8), processo `MGV7Central.exe` (roda na sessão do usuário). **É este que fala com
  a balança Prix de teste.**

### 2. Banco de dados local (SQL Server, instância `SQL_MGV7`)
Duas databases relevantes:
- `MGV7_CENTRAL` — config global/multi-loja (`tbLojas`, `tbConfiguracaoSistema`).
- `MGV7_0001` — dados da loja 1 (`tbBalanca`, `tbTipoBalanca`, `tbItemBalanca*`).

Registro da balança de teste (`tbBalanca` em `MGV7_0001`, `BAL_ENDERECO_IP='10.10.40.37'`):
```
BAL_CODIGO = 1
BAL_PORTA_COMUNICACAO = 9000
BAL_SHARED_KEY = (vazio)
BAL_DEVICE_ID = (vazio)
BAL_NUMERO_SERIE = (vazio)
BAL_MACADRESS = 001F10BAF20D
TPB_CODIGO = 40  -- "Prix 5 Plus (V8.9)"
```

`tbConfiguracaoSistema.CSI_CHAVE_OBRIG_BAL_ETH` (chave obrigatória p/ balança Ethernet)
está **vazio** — confirma que esta balança específica não usa criptografia por chave.

`tbLojas` (MGV7_CENTRAL): `LOJ_CODIGO=1`, `LOJ_PALAVRA_CHAVE` vazio,
`LOJ_CONEXAO` = string de conexão com o banco da loja, **armazenada criptografada**
(blob grande) — provavelmente DPAPI ou similar, atrelada à identidade/máquina do
processo real do MGV7Central. É o que travou o teste final (ver abaixo).

### 3. Assemblies .NET da Toledo (todas em `C:\Program Files (x86)\Toledo do Brasil\MGV 7\`)
Carregáveis via reflection (`Assembly.LoadFrom`), com um `AssemblyResolve` handler
apontando para a mesma pasta para resolver dependências. **Atenção:** compilar/rodar
sempre como `x86` (as DLLs nativas subjacentes são 32-bit) — `platform:x86` no `csc`.

- `cloud.prix.comuns.dll`
  - `cloud.prix.comuns.Protocolo.PTOLController` — implementação C# completa do
    framing do protocolo Toledo (STX/ETX/checksum/DLE-stuffing). Uso testado:
    ```csharp
    var ctrl = Activator.CreateInstance(ctrlType);
    ctrlType.GetMethod("Inicia").Invoke(ctrl, new object[] { 1 });
    var msg = (byte[])ctrlType.GetMethod("GeraMensagem").Invoke(ctrl, new object[] { "P", payloadBytes });
    // GeraMensagem("P", "TESTE") => 02:50:54:45:53:54:45:03:2b (STX+opcode+ASCII+ETX+checksum)
    ```
    Config (`ctrl.Cfg`, tipo `CfgPTol`): `ComCriptografia` (default `False`),
    `PossuiDadosBinarios`, `ValorInicializacaoCKS`, `NumBytesOpCode`.
  - `cloud.prix.comuns.Static.ServiceCriptografia.Crypt(string, string)` /
    `.Decrypt(string, string)` — criptografia gerenciada (hex string in/out),
    funciona sem crash, mas é usada para integração com redes de varejo
    (`EnumTipoCriptografia`: Toledo/Carrefour/CBD/DiaSupermercados/Exito), não
    necessariamente para o protocolo de balança em si. Chaves candidatas testadas
    sem sucesso (não é o caminho certo para decifrar o payload capturado).

- `TBR.MGV.Comunicacao.dll` — driver real de comunicação com a balança:
  - `Toledo.MGV7.Comunicacao.Balancas.FabricaBalanca.Instancia.CriaBalanca(...)`
    → fábrica que cria a instância certa por tipo de balança:
    ```csharp
    object balanca = criaBalanca.Invoke(fabrica, new object[] {
      1,              // codigoBal (BAL_CODIGO)
      meioEthernet,   // MeioComunicacaoEnum.Ethernet
      "10.10.40.37",  // enderecoIP
      9000,           // portaTCP
      "",             // chaveCripto (vazio == sem criptografia, confirmado no banco)
      null,           // gerenciador (GerenciadorRede — null funcionou)
      tipoPrix5V89,   // TipoBalancaEnum.Prix5V89 (=40)
      false,          // comunicaOpera
      null,           // logComunicacao (delegate, null funcionou)
      1               // codigoLoja
    });
    ```
  - Resultado: instância `Toledo.MGV7.Comunicacao.Balancas.BalancaPrix5V89`.
  - **TESTADO E FUNCIONANDO DE VERDADE contra a balança física:**
    ```csharp
    balType.GetMethod("Inicializa").Invoke(balanca, null);        // => True
    balType.GetMethod("AbreComunicacao").Invoke(balanca, null);   // => True (conexão TCP real!)
    balType.GetMethod("FechaComunicacao").Invoke(balanca, null);
    ```
  - Métodos de baixo nível disponíveis (ainda não testados com payload real):
    `TxBalFast(byte[] buffer, int qtdBytes, int frame, bool ultimoFrame, ulong crc, int indicePacote, bool ultimoPacote, bool quebraPacote)`,
    `EnviaDados(byte[] msgToSend, int qtdBytes, bool quebraPacote)`.
  - Propriedades relevantes em `BalancaPrix` (classe base): `ChaveCripto` (string,
    get/set), `DadosParaCarga` (object, get/set — estrutura ainda não identificada),
    `TxPedidoNCarga()` (bool).
  - Enums confirmados (`Toledo.MGV7.Comuns.Enums`, em `TBR.MGV.Comuns.dll`):
    `MeioComunicacaoEnum.Ethernet=3`, `TipoBalancaEnum.Prix5V89=40`.

- `TBR.MGV.WCF.dll` — **API de integração oficial do MGV7** (`Toledo.MGV7.WCF.IMGVService`
  / classe `Toledo.MGV7.WCF.MGVService`). Provavelmente o caminho de integração
  "correto" e suportado, em vez de falar TCP com a balança diretamente. Métodos
  relevantes: `ImportaItem`, `ImportaPreco` (`PrecoItemTO`), `AssociaItemBalanca`,
  `SolicitaCargaNaBalanca(int, SolicitaCargaTO)` /
  `SolicitaCargaNaBalancaEx(string palavraChave, int loja, string balancas, string opcoes)`,
  autenticação via `GetToken(usuario, senha)` ou `palavraChave`.
  - **Chamável diretamente em processo** via `Activator.CreateInstance` (sem precisar
    hospedar WCF/rede): `svc.ObtemVersao()` retornou `"7.5.22"` com sucesso.
  - `SolicitaCargaNaBalancaEx("", 1, "1", "")` executou sem crashar mas retornou erro
    genérico (`Codigo=-1, Msg="Erro: {0}"` — template não substituído). Hipótese mais
    provável: falha ao descriptografar `tbLojas.LOJ_CONEXAO` (string de conexão da
    loja, armazenada cifrada — provavelmente DPAPI atrelado à identidade/máquina do
    processo real do MGV7Central, que não bate ao instanciar a classe fora do host
    original).
  - Endpoint de rede do simulador (`Simulador.MGV7.WCF.exe.config`):
    `http://ce516:9300/MGV7_WCF/soap` — hostname genérico de build da Toledo, não bate
    com esta máquina (`Kleber_Duarte`); porta 9300 não está em LISTENING agora (serviço
    real não está hospedado neste ambiente).

## Ferramental criado nesta investigação

Scripts/binários no scratchpad da sessão (não versionados no repo — são ferramentas
de investigação pontuais, recompiláveis a partir deste documento se necessário):
- `hook-cripto.js` — script Frida para hookar `Cripto.dll` (não usado no final, MGV7
  não carrega essa DLL).
- Vários `.cs` compilados com `csc /platform:x86` para testar via reflection:
  probing de assinaturas nativas, inspeção de tipos/métodos das DLLs .NET da Toledo,
  teste de conexão real (`ConnectTest.cs`), teste do WCF em processo
  (`WCFDirectTest.cs`, `WCFCargaTest.cs`).

Padrão reutilizável para qualquer teste futuro via reflection contra essas DLLs:
```csharp
Assembly asm = Assembly.LoadFrom(@"NomeDaDll.dll"); // rodar com CWD = pasta do MGV7
                                                      // (ou copiar as DLLs pro mesmo dir)
Type[] types;
try { types = asm.GetTypes(); }
catch (ReflectionTypeLoadException ex) { types = ex.Types.Where(t => t != null).ToArray(); }
// compilar com: csc /nologo /platform:x86 /out:Teste.exe Teste.cs
// rodar isolado: Start-Process -FilePath ... -RedirectStandardOutput/-RedirectStandardError
```

## ATUALIZAÇÃO: envio de preço real bem-sucedido (2026-07-17, sessão de continuação)

Depois do checkpoint acima, resolvemos os dois blocos pendentes:

1. **WCF (`MGVService`) chamado diretamente via `Activator.CreateInstance`/reflection
   pura NÃO funciona de verdade** — mesmo com o `App.config` correto do MGV7Central
   copiado e mesmo eliminando o bug de "tipos duplicados" (ver abaixo), métodos como
   `SolicitaCargaNaBalancaEx` continuam retornando `Codigo=-1, Msg="Erro: {0}"`
   (mensagem de erro com placeholder não substituído). Conclusão: esse serviço
   precisa genuinamente ser hospedado via `System.ServiceModel.ServiceHost` (contexto
   WCF real), não apenas instanciado como objeto solto. **Caminho abandonado** — não
   vale o esforço de hospedar um WCF real só para isso.

2. **Achado colateral importante:** ao testar `ConsultaLojas` via reflection pura
   (`Assembly.LoadFrom` + `MethodInfo.Invoke`), o retorno (um enum `ERetornoExp`)
   dava erro `"O tipo fornecido deve ser um Enum"` ao tentar `Enum.GetUnderlyingType`.
   Isso é o clássico problema de **tipos duplicados por load context**: carregar a
   mesma DLL várias vezes via `LoadFrom` explícito (uma vez direto, outra como
   dependência transitiva resolvida pelo CLR) cria duas identidades de `Type`
   diferentes para a mesma classe. **Lição para qualquer teste futuro:** não usar
   `Assembly.LoadFrom` solto — referenciar as DLLs em **tempo de compilação**
   (`csc /reference:Nome.dll`) e usar tipos fortes (`using Toledo.MGV7...;`), com
   `AssemblyResolve` só como fallback para dependências transitivas não resolvidas
   automaticamente pelo probing padrão (que funciona bem quando todas as DLLs estão
   na mesma pasta do `.exe`).

3. **Caminho vencedor: driver TCP direto (`BalancaPrix5V89`), sem WCF.** Usamos os
   dados JÁ existentes no banco `MGV7_0001` (um item de teste real, "Queijo", já
   vinculado à balança 1 via `tbItemBalanca`) e chamamos o fluxo completo de carga.

   ⚠️ **Correção importante:** a primeira tentativa (`TxPedidoNCarga() = True` sozinho,
   sem `IniciaThread`) foi um **falso positivo** — `TxPedidoNCarga()` só confirma um
   handshake inicial de 6 bytes, não a transmissão do preço em si. A transmissão real
   acontece numa **thread interna assíncrona**, que só é disparada por `IniciaThread`,
   e essa thread crashava com `NullReferenceException` (método ofuscado, sem nome
   visível via reflection nem decompilação — `ilspycmd`/.NET decompiler não achou a
   string de log associada, sugere sistema de mensagens traduzidas em vez de string
   literal) até preenchermos duas dependências que a classe espera não-nulas:
   `InformacoesBalanca` (tipo `EstadoBalanca`) e `ConfiguracaoComunicacao` (tipo
   `ConfiguracaoComunicacaoTO`) — ambas com construtor parameterless, bastou
   instanciar com `Activator.CreateInstance` e atribuir antes de `Inicializa()`.

   **Receita completa, validada de ponta a ponta (inclusive confirmação visual na
   tela física da balança, preço mudou de R$15,00 para R$18,00):**

   ```csharp
   // compilar com:
   // csc /platform:x86 /reference:TBR.MGV.Comunicacao.dll /reference:TBR.MGV.Comuns.dll /reference:TBR.Componentes.dll ...
   using Toledo.MGV7.Comunicacao.Balancas;
   using Toledo.MGV7.Comuns.Enums;
   using Toledo.MGV7.Comuns.TOs;
   using Toledo.Componentes.Eventos;

   // GerenciadorRede é internal — instanciar via reflection (ctor sem parâmetros)
   Type grType = typeof(BalancaPrix).Assembly.GetType("Toledo.MGV7.Comunicacao.GerenciadorRede");
   object gerenciador = Activator.CreateInstance(grType, nonPublic: true);

   var fabrica = FabricaBalanca.Instancia;
   var criaBalanca = fabrica.GetType().GetMethod("CriaBalanca");
   BalancaPrix balanca = (BalancaPrix)criaBalanca.Invoke(fabrica, new object[] {
       1, MeioComunicacaoEnum.Ethernet, "10.10.40.37", 9000, "",
       gerenciador, TipoBalancaEnum.Prix5V89, false, null, 1
   });
   var balType = balanca.GetType();

   // Assinar eventos reais de progresso/conclusão (essenciais — sem isso não dá
   // pra saber se a transmissão terminou; TxPedidoNCarga()=True NÃO é suficiente)
   FindEvent(balType, "OnSucessoTransmissao").AddEventHandler(balanca,
       (AtualizacaoComunicacaoHandler)((s, e) => { /* sucesso real aqui */ }));
   FindEvent(balType, "OnFalhaComunicacao").AddEventHandler(balanca,
       (AtualizacaoComunicacaoHandler)((s, e) => { /* falha aqui */ }));
   // onAutorizaComunicacao (EventoPadrao.Arg5=true) e onSelecaoDadosTransmissao
   // (EventoBoolean.Valor=true) — a thread pergunta "posso comunicar?" / "tem dado
   // pra mandar?" via evento; sem responder true, ela aborta silenciosamente.
   FindEvent(balType, "onAutorizaComunicacao").AddEventHandler(balanca,
       (EventHandler<EventoPadrao>)((s, e) => e.Arg5 = true));
   FindEvent(balType, "onSelecaoDadosTransmissao").AddEventHandler(balanca,
       (EventHandler<EventoBoolean>)((s, e) => e.Valor = true));

   // Dependências internas que a thread de comunicação espera não-nulas:
   Type ebType = typeof(BalancaPrix).Assembly.GetType("Toledo.MGV7.Comunicacao.Handlers.EstadoBalanca");
   object estadoBalanca = Activator.CreateInstance(ebType, nonPublic: true);
   ebType.GetProperty("Balanca").SetValue(estadoBalanca, 1);
   balType.GetProperty("InformacoesBalanca").SetValue(balanca, estadoBalanca);

   Type cfgType = typeof(ItemBalancaTO).Assembly.GetType("Toledo.MGV7.Comuns.TOs.ConfiguracaoComunicacaoTO");
   balType.GetProperty("ConfiguracaoComunicacao").SetValue(balanca,
       Activator.CreateInstance(cfgType, nonPublic: true));

   balType.GetProperty("CodigoDaLoja").SetValue(balanca, 1);
   balType.GetProperty("Codigo").SetValue(balanca, 1);

   balanca.Inicializa();          // true
   balanca.AbreComunicacao();     // true — conexão TCP real com a balança

   balanca.DadosParaCarga = new List<ItemBalancaTO> {
       new ItemBalancaTO { CodigoBalanca = 1, CodigoItem = 1,
                            Estado = (EstadoItemBalancaEnum)2 /* AtualizarNaBalanca */,
                            Manual = false, Codigo = "1" }
   };

   // TxPedidoNCarga, IniciaThread, FechaComunicacao são `protected` — via reflection:
   balType.GetMethod("TxPedidoNCarga", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
       .Invoke(balanca, null);
   balType.GetMethod("IniciaThread", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
       .Invoke(balanca, new object[] { 1, false });   // ESSENCIAL — dispara a thread real

   // esperar o evento OnSucessoTransmissao (ou timeout) antes de FechaComunicacao()
   ```

   **Log real observado (resumo) confirmando o fluxo completo:**
   ```
   Estado da balança: VerificandoBalanca. Tentativa: 1. Porcentagem: 0
   ...
   Estado da balança: PreparandoInformacoes. Tentativa: 1. Porcentagem: 0 → 100
   Estado da balança: Comunicando. Tentativa: 1. Porcentagem: 0
   Estado da balança: SucessoComunicacao. Tentativa: 1. Porcentagem: 100
   [EVENTO] OnSucessoTransmissao!
   ```

   **Confirmado visualmente na tela física da balança**: preço mudou de R$15,00 para
   R$18,00 após esse fluxo (teste feito em 2026-07-17).

   `EstadoItemBalancaEnum`: `AtualizadoNaBalanca=1`, `AtualizarNaBalanca=2`,
   `AtualizarSomentePrecoBalanca=3`. Usamos `2` no teste bem-sucedido final.

   Nota: essa chamada não escreve de volta no banco do MGV7 (`tbItemBalanca` não
   muda) — cobre só a camada de driver/protocolo, não a lógica de negócio completa
   do MGV7. Para o PesoHub isso é irrelevante: o `SyncJob`/`SyncJobItem` do próprio
   PesoHub já cobre esse controle.

## Status: caminho A (via MGV7) — CONCLUÍDO E EMPACOTADO

**O driver TCP via MGV7 está 100% funcional, testado end-to-end e empacotado.**
Não é mais scripts soltos no scratchpad — é um projeto de verdade no repositório:

- `agent-local/prix-driver/Program.cs` — driver completo (lê IP/porta da balança e
  atualiza o preço direto no banco do MGV7, depois dispara a transmissão real via
  `FabricaBalanca`/`BalancaPrix`, com todos os hooks de evento necessários —
  `InformacoesBalanca`, `ConfiguracaoComunicacao`, `onAutorizaComunicacao`,
  `onSelecaoDadosTransmissao`, `IniciaThread`, espera por `OnSucessoTransmissao`).
- `agent-local/prix-driver/build.ps1` — compila via `csc.exe /platform:x86`.
- `agent-local/prix-driver/lib/README.md` — instruções para copiar as DLLs da
  Toledo (não versionadas — `.gitignore` protege `lib/*.dll`, decisão consciente
  para não redistribuir binários proprietários de terceiros no git).
- CLI: `PrixDriver.exe atualizar-preco --loja 0001 --codigo-balanca 1 --codigo-item 1 --preco 18.00 [--nome "..."] [--timeout-ms 30000]`
  → imprime uma linha JSON (`{"ok":true/false,"erro":...,"elapsedMs":...}`) em
  stdout, exit code 0/1 — pronto para o Agent Local (Node) chamar via
  `child_process.spawn`, análogo ao `scale-client.ts` da Ramuza.

**Testado e confirmado**: preço mudou de R$15,00 → R$18,00 na tela física da
balança usando este driver empacotado (não só o script de investigação).

`EstadoItemBalancaEnum` correto usado: `AtualizarNaBalanca=2` (já no código).

**Dependência real de implantação**: qualquer loja com balança Prix precisa ter o
MGV7 da Toledo instalado + SQL Server local (instância `SQL_MGV7`) + a balança e o
item já cadastrados nas tabelas do MGV7 (`tbBalanca`, `tbItens`, `tbItemBalanca`).
O driver lê/atualiza esses dados via SQL direto antes de disparar a transmissão.

## Status: caminho A' — protocolo Prix puro, SEM depender do MGV7 (PAUSADO, EM ANDAMENTO)

Decisão do time (2026-07-17, "software já vendido, precisa funcionar"): tentar
eliminar a dependência pesada do MGV7 acima, falando TCP puro com a balança como já
fazemos com a Ramuza. **Avaliação honesta de chance de sucesso feita na hora: ~35%**
— pode esbarrar de novo numa parede de criptografia real, como quase aconteceu com
a `Cripto.dll` do software antigo (LMP).

**Pausado por falta de acesso físico à balança** (ela estava fora da rede). Todo o
progresso e a ferramenta de captura pronta para retomar estão documentados em
`agent-local/prix-driver/investigacao/README.md` — **leia esse arquivo antes de
continuar esta linha de investigação**, ele tem o checklist exato dos próximos
passos (capturar bytes reais com preços diferentes, comparar payloads, decidir se
vale a pena continuar ou se é hora de aceitar a dependência do MGV7).

Resumo rápido do que já foi encontrado nessa fase: identificamos a classe real de
protocolo (`Toledo.Componentes.PPrix` em `TBR.Componentes.dll`, método
`PreparaMensagem(PPrixDataEnvio) -> List<byte[]>`), mas ainda não observamos o
conteúdo real do campo `Mensagem` (payload) para um comando de preço/PLU — é
exatamente isso que a ferramenta `CaptureBytes.cs` (pronta, não executada) vai
revelar assim que a balança estiver acessível de novo.
