import * as dotenv from "dotenv";
dotenv.config();

import { sendProductsToScale } from "./scale-client";

const SCALE_IP = process.env.SCALE_IP ?? "10.10.40.35";
const SCALE_PORT = Number(process.env.SCALE_PORT ?? 33581);

async function main() {
  console.log(`Enviando PLU de teste para ${SCALE_IP}:${SCALE_PORT}...`);
  const outcome = await sendProductsToScale(SCALE_IP, SCALE_PORT, [
    {
      codigo: "1010",
      codigoBarras: "",
      nome: "TESTE PLU REAL",
      preco: 12.34,
    },
  ]);
  console.log("Resultado:", outcome);
}

main();
