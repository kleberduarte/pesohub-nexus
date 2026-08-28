import { Socket } from "net";

/**
 * Nova hipótese: em toda captura de escrita bem-sucedida do Ramuza.exe, o
 * payload do DWL/NU3 chega fatiado em vários segmentos TCP (StreamWriter
 * .NET com AutoFlush=true manda campo-a-campo). Nossas escritas sempre
 * mandam o bloco inteiro numa chamada write() só, saindo como 1 segmento.
 * Testa se a balança exige o dado fatiado/com pequenos delays entre
 * pedaços em vez de tudo de uma vez.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-nu3-fragmented-write.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

// idx9 = 55,0 como marcador novo e distinto
const ROW0 =
  "NU3\t0\t\t\t0\t\t\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0";
const ROW1 =
  "NU3\t1\tFRAGMENTADO\t\t40\t\t\t55,0\t0,0\t55,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0";

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const socket = new Socket();
  socket.setNoDelay(true); // TCP_NODELAY, como o .NET Socket costuma usar por padrão em StreamWriter+AutoFlush
  socket.setEncoding("latin1");
  let buffer = "";
  socket.on("data", (chunk: string) => {
    buffer += chunk;
    console.log(">>> resposta:", JSON.stringify(chunk));
  });
  socket.on("error", (err) => console.log("Erro:", err.message));

  await new Promise<void>((resolve, reject) => {
    socket.connect(port, ip, () => resolve());
    socket.once("error", reject);
  });
  console.log(`Conectado a ${ip}:${port}. Escrevendo fatiado (write por linha, com pequeno delay)...`);

  // Cada chamada write() vira seu próprio pacote TCP com TCP_NODELAY ligado.
  socket.write("DWL\tNU3\t\r\n", "latin1");
  await wait(15);
  socket.write(ROW0 + "\r\n", "latin1");
  await wait(15);
  socket.write(ROW1 + "\r\n", "latin1");
  await wait(15);
  socket.write("END\tNU3\t\r\n\r\n", "latin1");
  await wait(15);
  socket.write("UPL\tTIM\t\r\n", "latin1");

  await wait(2000);
  socket.destroy();
  console.log("\nConexão encerrada. Rode probe-nu3-dump.ts pra conferir se índice 1 virou 'FRAGMENTADO'/55,0.");
  process.exit(0);
})();
