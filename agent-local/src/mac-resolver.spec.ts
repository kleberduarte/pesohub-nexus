import { extrairMacDaTabelaArp, mesmaSubRede, normalizarMac } from "./mac-resolver";

describe("extrairMacDaTabelaArp", () => {
  const windows = [
    "Interface: 192.168.15.8 --- 0x11",
    "  Endereço IP           Endereço físico       Tipo",
    "  192.168.15.1          10-98-5f-51-ce-30     dinâmico",
    "  192.168.15.10         fc-01-7c-b3-60-ad     dinâmico",
    "  192.168.15.255        ff-ff-ff-ff-ff-ff     estático",
    "  224.0.0.22            01-00-5e-00-00-16     estático",
  ].join("\r\n");

  it("lê o formato do Windows e normaliza", () => {
    expect(extrairMacDaTabelaArp(windows, "192.168.15.10")).toBe("fc:01:7c:b3:60:ad");
  });

  it("não confunde 192.168.15.1 com 192.168.15.10", () => {
    expect(extrairMacDaTabelaArp(windows, "192.168.15.1")).toBe("10:98:5f:51:ce:30");
  });

  it("recusa broadcast e multicast", () => {
    expect(extrairMacDaTabelaArp(windows, "192.168.15.255")).toBeNull();
    expect(extrairMacDaTabelaArp(windows, "224.0.0.22")).toBeNull();
  });

  it("lê o formato do Linux e trata entrada incompleta como ausente", () => {
    const linux = "? (192.168.15.23) at 00:1a:2b:3c:4d:5e [ether] on eth0\n? (192.168.15.24) at <incomplete> on eth0";
    expect(extrairMacDaTabelaArp(linux, "192.168.15.23")).toBe("00:1a:2b:3c:4d:5e");
    expect(extrairMacDaTabelaArp(linux, "192.168.15.24")).toBeNull();
  });

  it("IP ausente da tabela devolve null", () => {
    expect(extrairMacDaTabelaArp(windows, "192.168.15.99")).toBeNull();
  });
});

describe("mesmaSubRede", () => {
  const interfaces = {
    Ethernet: [
      { address: "192.168.15.8", netmask: "255.255.255.0", family: "IPv4", internal: false, mac: "", cidr: null },
    ],
    loopback: [{ address: "127.0.0.1", netmask: "255.0.0.0", family: "IPv4", internal: true, mac: "", cidr: null }],
  } as never;

  it("aceita IP do mesmo segmento", () => {
    expect(mesmaSubRede("192.168.15.23", interfaces)).toBe(true);
  });

  it("recusa IP atrás de roteador, onde o ARP devolveria o MAC do roteador", () => {
    expect(mesmaSubRede("192.168.20.23", interfaces)).toBe(false);
  });
});

it("normalizarMac", () => {
  expect(normalizarMac("FC-01-7C-B3-60-AD")).toBe("fc:01:7c:b3:60:ad");
});
