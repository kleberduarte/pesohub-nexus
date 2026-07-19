# Instalador do Agent Local

Gera um pacote autocontido (`.exe` + NSSM) que instala o `agent-local` como
serviço do Windows numa máquina da loja, sem precisar de Node.js instalado lá.

## Gerar o instalador (feito pelo time PesoHub, com internet)

```
cd agent-local
npm install
npm run package:installer
```

Isso vai:
1. Compilar o TypeScript (`tsc`).
2. Empacotar `dist/index.js` num executável standalone Windows (`installer/bin/agent-local.exe`), via `pkg`.
3. Gerar `installer/pesohub-agent-local-installer.zip`, contendo:
   - `install.ps1` / `uninstall.ps1`
   - `bin/agent-local.exe`
   - `bin/nssm.exe` (gerenciador de serviço Windows, https://nssm.cc)

> Na primeira vez, baixe o `nssm.exe` (64-bit) de https://nssm.cc/release/nssm-2.24.zip
> e coloque em `installer/bin/nssm.exe` antes de rodar `npm run package:installer`
> (não é versionado no git). Depois disso ele fica em cache local e não precisa
> baixar de novo.

## Instalar na máquina do cliente (sem internet, sem Node.js)

1. Copie `pesohub-agent-local-installer.zip` para a máquina (pendrive, etc.) e extraia.
2. Clique com o botão direito em `install.ps1` → **Executar com PowerShell** (como Administrador).
   - Se o PowerShell bloquear por política de execução, rode antes, num
     PowerShell como Admin: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
3. Responda os prompts:
   - URL do backend PesoHub
   - Token do agente (por loja)
   - Porta de descoberta UDP (padrão 33584, raramente precisa mudar)
4. O instalador copia tudo para `C:\PesoHub\agent-local`, registra e inicia o
   serviço Windows `PesoHubAgentLocal` (início automático, reinício automático
   se cair).
5. No painel PesoHub, vá em **Balanças → Buscar na Rede** para ver e vincular
   as balanças que o agente descobriu automaticamente (via broadcast UDP).
   Não é preciso digitar o IP de cada balança — nem quando são centenas delas.

## Padrão de instalação

- **Uma instalação do agent-local por rede/loja**, sempre numa máquina que
  esteja fisicamente na mesma rede das balanças (mesmo domínio de broadcast).
- A descoberta de balanças é automática via broadcast UDP — o agente não
  precisa (nem deve) ter IPs de balança fixados na configuração.
- Se uma loja tiver múltiplas redes/VLANs com balanças, é necessária uma
  instalação por rede, já que broadcast UDP não atravessa VLANs.

## Depois de instalado

- Logs: `C:\PesoHub\agent-local\agent-local.out.log` e `.err.log`
- Reconfigurar: editar `C:\PesoHub\agent-local\.env` e rodar
  `C:\PesoHub\agent-local\nssm.exe restart PesoHubAgentLocal`
- Checar status: `C:\PesoHub\agent-local\nssm.exe status PesoHubAgentLocal`
- Desinstalar: rodar `uninstall.ps1` como Administrador (do zip original, ou
  copie-o para a máquina também).

## Requisito de rede

A máquina onde o serviço roda precisa estar na **mesma rede local** das
balanças (mesmo range de IP), com:
- saída TCP liberada para a porta da balança (padrão 33581)
- escuta UDP liberada na porta de descoberta (padrão 33584)
- saída para a URL do backend configurada
