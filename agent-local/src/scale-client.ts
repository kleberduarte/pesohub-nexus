import { Socket } from "net";

export interface ScaleSyncPayload {
  codigo: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  categoriaImposto?: string;
}

export interface ScaleSyncOutcome {
  ok: boolean;
  erro?: string;
  itensProcessados?: number;
}

/**
 * Cliente TCP real para a balança Ramuza/Atena (protocolo TXT-MODE, SDK JHScale,
 * porta 33581 por padrão — ver manual "software de comunicação" e SPEC 166).
 *
 * O byte-a-byte do protocolo não está documentado (o manual descreve apenas a
 * GUI do software Windows). Por isso esta função hoje só confirma que consegue
 * abrir a conexão TCP e loga o que a balança responde — envio real de PLUs fica
 * pendente até decifrarmos o protocolo com scripts/probe.ts.
 */
export async function sendProductsToScale(
  ip: string,
  port: number,
  products: ScaleSyncPayload[],
): Promise<ScaleSyncOutcome> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(10_000);

    socket.connect(port, ip, () => {
      console.log(`[scale-client] TCP conectado em ${ip}:${port}, mas protocolo de envio ainda não implementado.`);
      socket.destroy();
      resolve({
        ok: false,
        erro:
          "Conexão TCP com a balança funcionou, mas o protocolo de envio de PLUs (TXT-MODE/JHScale) ainda não foi implementado — falta a especificação de baixo nível. Rode 'npm run probe' para investigar.",
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, erro: `Timeout ao conectar em ${ip}:${port}.` });
    });

    socket.on("error", (err) => {
      resolve({ ok: false, erro: `Falha de conexão TCP com a balança: ${err.message}` });
    });
  });
}
