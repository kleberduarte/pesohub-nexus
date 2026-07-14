# Agent Local

Processo que roda **dentro da rede da loja**, na mesma sub-rede da balança (ex: `10.10.40.x`), e faz a ponte entre o backend do Ramuza Nexus (que pode estar em outra rede/nuvem) e o hardware.

Não roda em `docker-compose.yml` do projeto principal porque sua localização é física — deve estar instalado numa máquina/servidor dentro da loja, na mesma sub-rede da balança.

## 1. Diagnóstico do protocolo (fazer isso primeiro)

Ainda não temos a especificação de baixo nível do protocolo TXT-MODE (SDK JHScale) que a balança fala na porta 33581 — só o manual do software Windows. Antes de confiar no envio de produtos, rode o probe **a partir de uma máquina na mesma sub-rede da balança**:

```bash
npm install
SCALE_IP=10.10.40.35 SCALE_PORT=33581 npm run probe
```

Isso conecta na balança e mostra em hexdump qualquer byte que ela mandar de volta. Cole o resultado de volta na conversa para decifrarmos o protocolo e implementarmos o envio real em `src/scale-client.ts`.

## 2. Rodar o agente

```bash
cp .env.example .env
# edite AGENT_BACKEND_URL, AGENT_TOKEN (mesmo token cadastrado no Agent do backend)
npm run start:dev
```

O token padrão de desenvolvimento (`dev-agent-local-token`) é criado automaticamente pelo seed do backend (`SEED_AGENT_TOKEN`).
