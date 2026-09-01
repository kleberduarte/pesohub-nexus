# Arquitetura do PesoHub Nexus

Este documento explica **por que** o sistema é assim. Para rodar e fazer deploy, veja o [README](./README.md).

---

## O problema que a arquitetura resolve

Uma balança etiquetadora Ramuza/Atena só aceita conexão **na rede local da loja**, por TCP na porta 33581, com um protocolo textual proprietário. Não há API, não há nuvem, não há autenticação.

Disso vêm as duas decisões estruturais:

1. **Existe um processo dentro da loja** (`agent-local`) — a nuvem não alcança a balança
2. **A sincronização é assíncrona** — depende de hardware que pode estar desligado, ocupado ou com IP trocado

Todo o resto é consequência.

---

## Camadas do backend

Clean Architecture, com dependências apontando **para dentro**:

```
presentation/     controllers, guards, middleware        (sabe de tudo)
application/      casos de uso, DTOs
domain/           entidades, interfaces de repositório    (não sabe de nada)
infrastructure/   Prisma, Redis, Socket.IO, integrações   (implementa o domínio)
```

O exemplo canônico:

- `domain/repositories/device.repository.ts` — **interface**, sem Prisma
- `infrastructure/database/device.prisma.repository.ts` — implementação
- Injeção pelo símbolo `DEVICE_REPOSITORY`

O domínio não importa Prisma. Trocar o ORM não tocaria em regra de negócio.

**192 arquivos, ~43 linhas cada.** Mantenha assim.

> O frontend **não** tem estrutura equivalente (~456 linhas/arquivo, lógica nas páginas). É dívida conhecida — cards #63 e #64.

---

## O caminho de uma sincronização

```
1. tela          POST /sync                       cria SyncJob
2. backend       publica na fila BullMQ (Redis)
3. worker        monta o payload (produtos, formatos, tabelas nutricionais)
4. worker        publica em agent:command:<agentId> no Redis
5. AgentGateway  entrega por Socket.IO ao agent daquela loja
6. agent-local   converte para o protocolo e escreve por TCP na balança
7. agent-local   RELÊ e confere se gravou            <-- ver "ACK não é prova"
8. resposta volta pelo mesmo caminho até SyncJob.erro
```

O passo 7 não é zelo excessivo. É o que separa este sistema de um que mente.

---

## Armadilhas de silêncio

**O traço mais importante deste domínio: a balança aceita comandos e os descarta sem erro.** Cada item abaixo custou de horas a sessões inteiras.

### 1. Contagem de campos

O bloco `NU3` (tabela nutricional) exige **58 campos**; saía com 57. A balança respondia normalmente e não gravava.

Foram **28 tentativas** até alguém comparar campo a campo com uma captura de escrita bem-sucedida do software oficial.

### 2. Slot de etiqueta ocupado por modelo de fábrica

Gravar um `LAB` num slot que já tem preset de fábrica (o slot 1 é `"PF-1"`) é aceito e ignorado. O produto passa a imprimir com o layout da Ramuza.

Foi assim que uma etiqueta em produção saiu **sem tabela nutricional** — com o vínculo nutricional perfeitamente correto o tempo todo.

**Não existe faixa segura.** Os slots 22 e 23 estão na região "de fábrica" e gravam normalmente — são a convenção do projeto. Quais slots rejeitam varia por equipamento.

### 3. O dump `UPL/LAB` é incompleto E sinaliza fim

Quatro leituras seguidas contra a mesma balança:

```
65 registros | fim=END     | slot23=sim  slot40=sim
64 registros | fim=timeout | slot23=sim  slot40=sim
54 registros | fim=END     | slot23=sim  slot40=NÃO
52 registros | fim=timeout | slot23=NÃO  slot40=sim
```

Duas delas terminaram com `END\tLAB` — o marcador de fim — e ainda assim faltavam registros.

**Consequência de design:** informação vinda do dump é **aditiva**. Ausência nunca significa "livre". Ver `unirSlotsEtiqueta` em `agent.gateway.ts`.

A leitura **filtrada** (`UPL/LAB/<n>`) é confiável.

### 4. Código de produto não-numérico

Descarta o PLU inteiro, sem erro.

### 5. Leitura que falha não é dado

Uma leitura que falha devolve resposta vazia. Tratar vazio como "não há nada gravado" produz alarme falso — já gerou um diagnóstico de "a balança foi zerada" quando nada tinha acontecido.

**Distinga sempre falha de leitura de resultado vazio.** Há testes travando isso em `scale-client.spec.ts`.

---

## A regra que atravessa tudo

> **ACK não é prova. Só a releitura é.**

Escreveu? Leia de volta e compare. É o que fechou os cards #51, #54 e #59, e o que impede o sistema de reportar sucesso mentindo.

O corolário na interface: **não prometa o que não vai acontecer.** A tela já disse "sucesso" quando nada foi gravado, e "retry automático" quando não havia retry possível. Ambos foram corrigidos porque enganavam.

---

## Outras coisas que mordem

**O software oficial da Ramuza e a balança são bancos separados.** O `ECS.mdb` local do software não reflete a memória do equipamento — medido: 1 PLU no arquivo, 36 na balança. Apagar no software não alcança a balança. O ciclo completo é "Carregar para software" → editar → "Download para balança", **nessa ordem** (inverter sobrescreve a balança).

**`worker/prisma/schema.prisma` é cópia manual** do backend. Toda migração exige copiar e rodar `prisma generate` no worker.

**O IP da balança é DHCP** e muda. Já aconteceu de o IP antigo passar a ser outra máquina da rede.

**A balança atende um cliente por vez.** `ECONNRESET` na 33581 costuma ser o software da Ramuza aberto. Ela também **para de responder sob conexões em sequência rápida** e volta em ~20s — por isso o mapa de slots é consultado a cada 10 minutos, não a cada minuto.

---

## Convenções

- **Comentários explicam o porquê, e registram o que já falhou.** Um comentário que diz "tentamos X, não funcionou porque Y" vale mais que dez que descrevem o óbvio. É o padrão mais valioso do código.
- Slots de etiqueta: **dev = 22, produção = 23**.
- Antes de qualquer escrita em massa na balança: `agent-local/src/probe-plu-backup.ts`. Uma linha lida por `UPL/PLU` pode ser reescrita verbatim e volta idêntica byte a byte — o dump é backup restaurável de verdade.
- Commits e comentários em português.

---

## Onde o conhecimento está

O board do Trello é a memória longa do projeto — cada armadilha acima tem um card com a investigação, as medições e o que foi descartado. Os comentários no código apontam para eles.
