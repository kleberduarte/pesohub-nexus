import { execFile } from "child_process";
import { networkInterfaces } from "os";

/**
 * MAC da balança, lido da tabela ARP do sistema (card #79).
 *
 * A balança pega IP por DHCP e troca de endereço ao ser religada; o broadcast
 * de descoberta só traz a porta, nenhum número de série. O MAC é o único
 * identificador estável que o agente enxerga sem abrir sessão TCP — e a
 * balança atende uma sessão por vez, então consultar o ARP não disputa nada
 * com a sincronização nem com o software da Ramuza aberto na loja.
 *
 * O broadcast acabou de chegar daquele IP, então o SO normalmente já tem a
 * entrada; se não tiver, um ping a cria.
 */

const MAC_REGEX = /([0-9a-f]{2}[-:]){5}[0-9a-f]{2}/i;

/** Normaliza para `aa:bb:cc:dd:ee:ff`. */
export function normalizarMac(mac: string): string {
  return mac.toLowerCase().replace(/-/g, ":");
}

/**
 * Extrai o MAC de um IP da saída do `arp -a` (Windows: `10-98-5f-...`) ou do
 * `arp -n` (Linux/mac: `10:98:5f:...`). Casa a linha pelo IP exato, para não
 * pegar `192.168.15.10` quando se procura `192.168.15.1`.
 */
export function extrairMacDaTabelaArp(saida: string, ip: string): string | null {
  const ipEscapado = ip.replace(/\./g, "\\.");
  const linhaDoIp = new RegExp(`(^|[\\s(])${ipEscapado}([\\s)]|$)`);
  for (const linha of saida.split(/\r?\n/)) {
    if (!linhaDoIp.test(linha)) continue;
    const mac = linha.match(MAC_REGEX)?.[0];
    if (!mac) continue;
    const normalizado = normalizarMac(mac);
    // Broadcast/multicast e entrada incompleta não identificam aparelho nenhum.
    if (normalizado === "ff:ff:ff:ff:ff:ff" || normalizado === "00:00:00:00:00:00") return null;
    if (parseInt(normalizado.slice(0, 2), 16) & 1) return null;
    return normalizado;
  }
  return null;
}

function ipParaNumero(ip: string): number | null {
  const partes = ip.split(".").map(Number);
  if (partes.length !== 4 || partes.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((partes[0] << 24) | (partes[1] << 16) | (partes[2] << 8) | partes[3]) >>> 0;
}

/**
 * True se o IP está na mesma sub-rede de alguma interface local.
 *
 * Só nesse caso o MAC do ARP é da balança. Com um roteador no meio, a tabela
 * ARP guarda o MAC do roteador — e vincular isso a uma balança faria todas as
 * balanças do outro segmento parecerem o mesmo aparelho.
 */
export function mesmaSubRede(
  ip: string,
  interfaces: ReturnType<typeof networkInterfaces> = networkInterfaces(),
): boolean {
  const alvo = ipParaNumero(ip);
  if (alvo === null) return false;
  for (const enderecos of Object.values(interfaces)) {
    for (const e of enderecos ?? []) {
      if (e.family !== "IPv4" || e.internal) continue;
      const local = ipParaNumero(e.address);
      const mascara = ipParaNumero(e.netmask);
      if (local === null || mascara === null) continue;
      if (((local & mascara) >>> 0) === ((alvo & mascara) >>> 0)) return true;
    }
  }
  return false;
}

function executar(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 3000, windowsHide: true }, (_err, stdout) => resolve(String(stdout ?? "")));
  });
}

async function lerArp(ip: string): Promise<string | null> {
  const args = process.platform === "win32" ? ["-a", ip] : ["-n", ip];
  return extrairMacDaTabelaArp(await executar("arp", args), ip);
}

/** MAC da balança nesse IP, ou null quando não dá para afirmar qual é. */
export async function resolverMac(ip: string): Promise<string | null> {
  if (!mesmaSubRede(ip)) return null;
  const direto = await lerArp(ip);
  if (direto) return direto;
  const pingArgs = process.platform === "win32" ? ["-n", "1", "-w", "1000", ip] : ["-c", "1", "-W", "1", ip];
  await executar("ping", pingArgs);
  return lerArp(ip);
}
