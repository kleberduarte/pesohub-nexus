/**
 * Analisa uma captura Wireshark (exportada como `tshark -T json`) do protocolo
 * TXT-MODE da balança (porta 33581) e extrai todos os registros PLU/NU3 (ou
 * outro tipo) como arrays indexados, prontos pra comparar.
 *
 * Fluxo recomendado (ver [[project_scale_protocol_field_gap]] na memória):
 * 1. Capture um PLU "baseline" sem mexer no campo que você quer descobrir.
 * 2. Capture de novo mudando UM ÚNICO campo (delta pequeno, ex.: texto extra 2).
 * 3. Rode este script nos dois arquivos — ele mostra só os índices que mudaram.
 *
 * Uso:
 *   npx ts-node --transpile-only src/analyze-plu-capture.ts captura.json
 *   npx ts-node --transpile-only src/analyze-plu-capture.ts baseline.json depois.json
 *
 * Como gerar o JSON no Wireshark/tshark:
 *   tshark -r captura.pcapng -Y "tcp.port==33581" -T json > captura.json
 *
 * IMPORTANTE: mensagens grandes (ex.: DWL/PLU + DWL/NU3 juntos) costumam vir
 * fragmentadas em mais de um pacote TCP. Este script reconstrói o stream
 * inteiro (concatena `data.data` de todos os pacotes na ordem do arquivo)
 * antes de procurar linhas — não analisa pacote a pacote, senão um registro
 * cortado no meio aparece com metade dos campos faltando.
 */
import { readFileSync } from "fs";

interface TsharkPacket {
  _source: {
    layers: {
      data?: { "data.data"?: string }; // hex string, ex.: "44:57:4c:09:50:4c:55..."
    };
  };
}

interface Record_ {
  tipo: string;
  fields: string[];
}

function hexToLatin1(hex: string): string {
  const buf = Buffer.from(hex.replace(/:/g, ""), "hex");
  return buf.toString("latin1");
}

/** Reconstrói o stream TCP inteiro do arquivo, concatenando os payloads na ordem em que aparecem. */
function reassembleStream(jsonPath: string): string {
  const packets: TsharkPacket[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
  let full = "";
  for (const pkt of packets) {
    const dataHex = pkt._source?.layers?.data?.["data.data"];
    if (dataHex) full += hexToLatin1(dataHex);
  }
  return full;
}

function allLines(jsonPath: string): string[] {
  return reassembleStream(jsonPath)
    .split(/\r\n/)
    .filter(Boolean);
}

/** Registros "de dados" reais (ex. "PLU\t1\t9003\t...", "NU3\t2\tLaranja\t..."), não os cabeçalhos "DWL\tPLU\t". */
function extractRecords(jsonPath: string, tipos = ["PLU", "NU3"]): Record_[] {
  const records: Record_[] = [];
  for (const line of allLines(jsonPath)) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    if (!tipos.includes(parts[0])) continue;
    if (parts.length > 5) records.push({ tipo: parts[0], fields: parts });
  }
  return records;
}

function printOtherVerbs(jsonPath: string): void {
  const seen = new Set<string>();
  for (const line of allLines(jsonPath)) {
    const [verb, noun] = line.split("\t");
    if (!verb || !noun) continue;
    const key = `${verb}/${noun}`;
    if (key === "UPL/TIM" || key === "DWL/TIM" || key === "UPL/END") continue; // heartbeat/protocolo, ruído conhecido
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`verbo/substantivo não-heartbeat: ${key} — linha completa: "${line}"`);
  }
}

function printRecord(r: Record_, index: number): void {
  console.log(`\n[registro ${index}] ${r.tipo} — ${r.fields.length} campos`);
  r.fields.forEach((f, i) => {
    if (f !== "") console.log(`  idx${i}: "${f}"`);
  });
}

function diffRecords(a: Record_, b: Record_): void {
  console.log(`\n=== DIFF: ${a.tipo}(idx1="${a.fields[1]}") -> ${b.tipo}(idx1="${b.fields[1]}") ===`);
  const maxLen = Math.max(a.fields.length, b.fields.length);
  let anyDiff = false;
  for (let i = 0; i < maxLen; i++) {
    const va = a.fields[i] ?? "<ausente>";
    const vb = b.fields[i] ?? "<ausente>";
    if (va !== vb) {
      anyDiff = true;
      console.log(`  idx${i}: "${va}" -> "${vb}"`);
    }
  }
  if (!anyDiff) console.log("  (nenhuma diferença encontrada — confira se a captura tem o registro certo)");
}

const [, , fileA, fileB] = process.argv;

if (!fileA) {
  console.error("Uso: ts-node analyze-plu-capture.ts <captura.json> [depois.json]");
  process.exit(1);
}

const recordsA = extractRecords(fileA);
console.log(`${fileA}: ${recordsA.length} registro(s) PLU/NU3 encontrado(s).`);
recordsA.forEach(printRecord);
console.log(`\n--- Outros verbos/substantivos vistos em ${fileA} (fora heartbeat) ---`);
printOtherVerbs(fileA);

if (fileB) {
  const recordsB = extractRecords(fileB);
  console.log(`\n${fileB}: ${recordsB.length} registro(s) PLU/NU3 encontrado(s).`);
  recordsB.forEach(printRecord);

  if (recordsA.length === 0 || recordsB.length === 0) {
    console.log("\nNão dá pra comparar — falta registro PLU/NU3 em um dos arquivos.");
  } else {
    // Compara o último registro do mesmo tipo em cada arquivo (mais provável de ser o teste mais recente)
    for (const tipo of ["PLU", "NU3"]) {
      const lastA = [...recordsA].reverse().find((r) => r.tipo === tipo);
      const lastB = [...recordsB].reverse().find((r) => r.tipo === tipo);
      if (lastA && lastB) diffRecords(lastA, lastB);
    }
  }
}
