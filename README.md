# PesoHub Nexus

Plataforma de gestão de balanças etiquetadoras. Cadastra produtos, tabelas nutricionais e layouts de etiqueta na nuvem, e sincroniza tudo para balanças **Ramuza/Atena** instaladas nas lojas.

O produto é multi-tenant: uma **empresa** (revendedor, ex.: Ramuza) atende várias **lojas**, cada uma com suas balanças.

---

## Topologia — e por que são quatro componentes

```
   navegador                    nuvem                        loja
  ┌──────────┐          ┌──────────────────┐         ┌─────────────────┐
  │ frontend │ ──HTTP──▶│     backend      │         │  agent-local    │
  │ Next.js  │          │     NestJS       │◀─socket─│   (Windows)     │
  │ (Vercel) │          │   (Railway)      │   .io   │                 │
  └──────────┘          └────────┬─────────┘         └────────┬────────┘
                                 │ Redis                      │ TCP 33581
                                 ▼                            ▼
                        ┌──────────────────┐         ┌─────────────────┐
                        │      worker      │         │     balança     │
                        │  BullMQ (Railway)│         │  Ramuza/Atena   │
                        └──────────────────┘         └─────────────────┘
```

| Componente | Stack | Onde roda | Por que existe |
|---|---|---|---|
| `frontend` | Next.js (App Router), Tailwind | Vercel | Interface |
| `backend` | NestJS, Prisma, PostgreSQL | Railway | API e regras |
| `worker` | BullMQ | Railway | Processa a fila de sincronização fora do ciclo de request |
| `agent-local` | Node + socket.io-client | **Máquina dentro da loja** | A balança só é alcançável na rede local da loja. A nuvem não fala TCP com ela |

**O `agent-local` é a razão de a arquitetura não ser um CRUD comum.** Ele é distribuído como executável (`pkg`) e instalado à mão em cada loja.

### O caminho de uma sincronização

```
tela → backend → Redis → worker → gateway Socket.IO → agent-local → TCP → balança
```

---

## Como subir o ambiente

### Docker (tudo de uma vez)

```bash
./iniciar.bat          # Windows
# ou
cd docker && docker compose up --build
```

| Serviço | Porta |
|---|---|
| frontend | 3001 |
| backend | 3000 |
| postgres | 5436 |
| redis | 6381 |

> **Armadilha:** o `WslService` do Windows trava com frequência e impede o Docker Desktop de subir. Contorno (como administrador): `Restart-Service WslService -Force`. Ver card Trello #50.

### Por componente

```bash
cd backend     && npm install && npx prisma generate && npm run start:dev
cd frontend    && npm install && npm run dev
cd worker      && npm install && npm run start:dev
cd agent-local && npm install && npm run start:dev
```

O `agent-local` precisa de um `.env` com `AGENT_BACKEND_URL`, `AGENT_TOKEN`, `SCALE_IP` e `SCALE_PORT`.

---

## Deploy — não é automático

**Nem Railway nem Vercel sobem sozinhos no push.** O deploy é manual, sempre:

```bash
railway up --service pesohub-nexus            # backend
railway up --service determined-upliftment    # worker
cd frontend && vercel --prod                  # frontend
```

### Nomes que ninguém adivinha

- **O serviço do worker no Railway chama-se `determined-upliftment`** — nome autogerado, sem relação com "worker". Para confirmar: `railway status --json` mostra `rootDirectory: /worker`.
- **O health do backend é `/api/v1/health`**, não `/health`. Existe um `setGlobalPrefix("api/v1")` em `backend/src/main.ts`. `/health` devolve 404 e parece deploy quebrado quando não está.

### Migrações

Rodam sozinhas: o `CMD` do Dockerfile do backend executa `prisma migrate deploy` antes do `node dist/main`.

> **Armadilha:** `worker/prisma/schema.prisma` é uma **cópia manual** do schema do backend. Toda migração no backend exige copiar o arquivo e rodar `npx prisma generate` no worker — senão o worker perde silenciosamente o escopo por tenant.

---

## Testes

```bash
cd backend && npm test      # 81 testes
cd worker  && npm test      #  4 testes
cd agent-local && npm test  # 34 testes
```

O CI (`.github/workflows/ci.yml`) roda os quatro componentes a cada push.

> O **frontend ainda não tem testes** — é a maior dívida técnica conhecida. Ver card Trello #63.

---

## Antes de mexer: as armadilhas do domínio

A balança **aceita comandos e os descarta em silêncio**. Não há erro no protocolo. Isso já custou sessões inteiras de debug, e é o traço mais importante deste sistema:

- **Contagem de campos errada** → registro descartado (o `NU3` exigia 58 campos, saía com 57)
- **Slot de etiqueta ocupado por modelo de fábrica** → gravação ignorada, a etiqueta sai com o layout da Ramuza
- **Código de produto não-numérico** → PLU inteiro descartado

**Regra que atravessa o projeto: ACK não é prova. Só a releitura é.** Escreva, leia de volta, compare.

Outras que valem saber antes do primeiro dia:

- O dump `UPL/LAB` é **incompleto e sinaliza fim mesmo assim** — ausência de um slot nunca significa "livre"
- O software oficial da Ramuza e a memória da balança são **bancos separados que não se falam**
- O **IP da balança é DHCP** e muda
- `ECONNRESET` na porta 33581 = o software da Ramuza está aberto segurando a sessão

Detalhes e o histórico de cada uma: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Convenções

- **Comentários explicam o porquê, não o quê** — e registram o que já foi tentado e falhou. É o padrão mais valioso do código; mantenha.
- Slots de etiqueta na balança: **dev = 22, produção = 23**.
- Commits e comentários em português.
