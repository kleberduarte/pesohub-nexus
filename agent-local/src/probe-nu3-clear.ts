import { Socket } from "net";

/**
 * Testa candidatos a comando de "limpar"/"excluir" o NU3, inspirado na função
 * `JH_ClearCustom(hDevice, id)` do SDK JHScale.dll (única função de "Custom"
 * que recebe o device como parâmetro além de SetCustom — logo é operação de
 * rede de verdade, não só manipulação de buffer local como SetFirstCustom).
 * Não temos a sintaxe exata (é DLL fechada), então testamos variações
 * plausíveis contra o índice 1 (que sabemos ter conteúdo real: idx9="99,0").
 *
 * Uso: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-clear.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);
const TABLE_INDEX = 1;

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function tryCandidate(label: string, body: string): Promise<void> {
  const socket = new Socket();
  let raw = Buffer.alloc(0);
  socket.on("data", (chunk: Buffer) => {
    raw = Buffer.concat([raw, chunk]);
  });
  socket.on("error", (err) => console.log(`  [${label}] erro: ${err.message}`));

  await new Promise<void>((resolve, reject) => {
    socket.connect(port, ip, () => resolve());
    socket.once("error", reject);
  }).catch(() => {});

  console.log(`\n>>> Tentando [${label}]:`);
  console.log(`    ${JSON.stringify(body)}`);
  raw = Buffer.alloc(0);
  socket.write(Buffer.from(body, "latin1"));
  await wait(1500);
  console.log(`    resposta: ${JSON.stringify(raw.toString("latin1"))}`);
  socket.write(Buffer.from("UPL\tEND\t\r\n", "latin1"));
  await wait(300);
  socket.destroy();
  await wait(500);
}

(async () => {
  console.log(`Estado antes (índice ${TABLE_INDEX} deve ter idx9="99,0")...`);

  const candidates: Array<{ label: string; body: string }> = [
    { label: "DEL/NU3/<id>", body: `DEL\tNU3\t${TABLE_INDEX}\t\r\n` },
    { label: "CLR/NU3/<id>", body: `CLR\tNU3\t${TABLE_INDEX}\t\r\n` },
    { label: "DWL/NU3 só com ID (sem resto dos campos)", body: `DWL\tNU3\t\r\nNU3\t${TABLE_INDEX}\t\r\nEND\tNU3\t\r\n` },
    { label: "DWL/NU3 com ID negativo (convenção comum de 'apagar')", body: `DWL\tNU3\t\r\nNU3\t-${TABLE_INDEX}\t\r\nEND\tNU3\t\r\n` },
    { label: "UPL/NU3/CLR/<id>", body: `UPL\tNU3\tCLR\t${TABLE_INDEX}\t\r\n` },
  ];

  for (const c of candidates) {
    await tryCandidate(c.label, c.body);
  }

  console.log("\nFeito. Rode probe-nu3-dump.ts pra conferir se ALGUM desses mudou o estado do índice 1.");
  process.exit(0);
})();
