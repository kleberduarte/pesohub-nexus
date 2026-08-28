import { Socket } from "net";
import { buildSyncBody, ScaleSyncOutcome, ScaleSyncPayload } from "./scale-client";

const HEARTBEAT_INTERVAL_MS = 30_000;
const CONNECT_TIMEOUT_MS = 10_000;
const WRITE_TIMEOUT_MS = 10_000;

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/**
 * Conexão TCP persistente por balança (protocolo TXT-MODE, porta 33581).
 *
 * Por quê: uma captura Wireshark real do software oficial da Ramuza
 * (`captura06.json`, 2026-08-27, ver [[project_scale_protocol_field_gap]])
 * mostrou que a única escrita `DWL/NU3` confirmada como persistida na balança
 * veio de uma conexão TCP que ficou aberta ~28 minutos, com bastante
 * atividade real (handshake INF, heartbeats UPL/TIM periódicos, múltiplas
 * escritas DWL/PLU) antes da escrita do NU3. Todas as 20+ tentativas
 * anteriores usando uma conexão nova e efêmera (abrir → escrever → fechar,
 * como `sendProductsToScale` faz) falharam em persistir o conteúdo do NU3,
 * mesmo replicando os bytes exatos da sequência bem-sucedida.
 *
 * Esta classe mantém UMA conexão TCP por dispositivo, viva indefinidamente
 * com heartbeats reais, e roteia todas as escritas de sync por ela — assim,
 * no uso normal de produção (syncs periódicos + heartbeat entre eles), a
 * conexão "envelhece" com atividade real, igual ao padrão observado no
 * software oficial, sem precisar de nenhum truque artificial de aquecimento.
 */
export class ScaleConnection {
  private socket: Socket | null = null;
  private connectedAt: number | null = null;
  private buffer = "";
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectingPromise: Promise<void> | null = null;
  private pendingWrite: { resolve: (outcome: ScaleSyncOutcome) => void; itensProcessados: number } | null = null;

  constructor(
    private readonly ip: string,
    private readonly port: number,
  ) {}

  get ageMs(): number {
    return this.connectedAt != null ? Date.now() - this.connectedAt : 0;
  }

  get isConnected(): boolean {
    return this.socket != null && !this.socket.destroyed;
  }

  async sendProducts(products: ScaleSyncPayload[]): Promise<ScaleSyncOutcome> {
    try {
      await this.ensureConnected();
    } catch (err) {
      return { ok: false, erro: `Falha ao conectar na balança ${this.ip}:${this.port}: ${(err as Error).message}` };
    }

    return new Promise<ScaleSyncOutcome>((resolve) => {
      const socket = this.socket;
      if (!socket) {
        resolve({ ok: false, erro: "Conexão não disponível." });
        return;
      }

      this.buffer = "";
      this.pendingWrite = { resolve, itensProcessados: products.length };

      const timeout = setTimeout(() => {
        if (this.pendingWrite) {
          const p = this.pendingWrite;
          this.pendingWrite = null;
          p.resolve({ ok: false, erro: `Timeout aguardando confirmação da balança ${this.ip}:${this.port}.` });
        }
      }, WRITE_TIMEOUT_MS);

      const originalResolve = this.pendingWrite.resolve;
      this.pendingWrite.resolve = (outcome) => {
        clearTimeout(timeout);
        originalResolve(outcome);
      };

      socket.write(buildSyncBody(products), "latin1");
    });
  }

  /** Fecha a conexão e limpa o heartbeat — usar só em shutdown do agente. */
  close(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.socket?.destroy();
    this.socket = null;
    this.connectedAt = null;
  }

  private async ensureConnected(): Promise<void> {
    if (this.isConnected) return;
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = this.connect().finally(() => {
      this.connectingPromise = null;
    });
    return this.connectingPromise;
  }

  private async connect(): Promise<void> {
    const socket = new Socket();
    socket.setEncoding("latin1");
    socket.setTimeout(CONNECT_TIMEOUT_MS);

    let handshakeBuffer = "";
    const onData = (chunk: string) => {
      if (this.pendingWrite) {
        this.buffer += chunk;
        if (this.buffer.includes("END\tTIM")) {
          const p = this.pendingWrite;
          this.pendingWrite = null;
          socket.write("UPL\tEND\t\r\n", "latin1");
          p.resolve({ ok: true, itensProcessados: p.itensProcessados });
        }
      } else {
        handshakeBuffer += chunk;
      }
    };

    socket.on("data", onData);
    socket.on("error", (err) => this.handleDisconnect(`erro de socket: ${err.message}`));
    socket.on("close", () => this.handleDisconnect("conexão fechada pela balança"));
    socket.on("timeout", () => this.handleDisconnect("timeout de conexão"));

    await new Promise<void>((resolve, reject) => {
      const onConnectError = (err: Error) => reject(err);
      socket.once("error", onConnectError);
      socket.connect(this.port, this.ip, () => {
        socket.removeListener("error", onConnectError);
        // `setTimeout` do Node é um timeout de INATIVIDADE pra vida inteira do
        // socket, não só da fase de conexão — como o heartbeat só escreve a
        // cada 30s (> CONNECT_TIMEOUT_MS), deixar isso ligado depois de
        // conectar disparava "timeout" a cada ciclo ocioso e derrubava a
        // conexão persistente sozinha (`handleDisconnect` zerava `this.socket`
        // mesmo com a conexão TCP ainda válida). Desliga aqui; os timeouts de
        // escrita continuam cobertos pelo `setTimeout` próprio em
        // `sendProducts`.
        socket.setTimeout(0);
        resolve();
      });
    });

    this.socket = socket;
    this.connectedAt = Date.now();

    // Handshake de registro: BOM UTF-8 cru (dispara o anúncio espontâneo
    // DWL/INF da balança, ver achado 2026-08-27 em
    // [[project_scale_protocol_field_gap]]) + UPL/INF, depois UPL/END em
    // resposta ao anúncio.
    socket.write(UTF8_BOM);
    await new Promise((r) => setTimeout(r, 200));
    socket.write("\r\nUPL\tINF\t\r\n", "latin1");
    await new Promise((r) => setTimeout(r, 800));
    if (handshakeBuffer.includes("END\tINF")) {
      socket.write("UPL\tEND\t\r\n", "latin1");
    }

    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected || this.pendingWrite) return;
      this.socket?.write("UPL\tTIM\t\r\n", "latin1");
    }, HEARTBEAT_INTERVAL_MS);
  }

  private handleDisconnect(reason: string): void {
    if (this.pendingWrite) {
      const p = this.pendingWrite;
      this.pendingWrite = null;
      p.resolve({ ok: false, erro: `Conexão com a balança ${this.ip}:${this.port} caiu: ${reason}` });
    }
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    this.socket = null;
    this.connectedAt = null;
  }
}
