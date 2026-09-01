import { Socket } from "net";
const ip = process.env.SCALE_IP!;
const port = Number(process.env.SCALE_PORT ?? 33581);
const s = new Socket();
s.setTimeout(10000); s.setEncoding("latin1");
let buf = "";
s.connect(port, ip, () => s.write("UPL\tLAB\t\r\n", "latin1"));
s.on("data", (c: string) => {
  buf += c;
  if (buf.includes("END\tLAB")) {
    const ids = buf.split("\r\n").filter(l => l.startsWith("LAB\t")).map(l => l.split("\t")[1]);
    console.log("slots LAB ocupados:", ids.join(", "));
    s.destroy(); process.exit(0);
  }
});
s.on("timeout", () => { console.log("timeout; parcial:", buf.slice(0,300)); process.exit(1); });
s.on("error", e => { console.error("erro:", e.message); process.exit(1); });
