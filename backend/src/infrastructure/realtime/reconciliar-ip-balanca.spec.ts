import { DeviceRegistrado, planejarReconciliacao } from "./reconciliar-ip-balanca";

/**
 * Card #79 — a balança troca de IP (DHCP) ao religar. Ela é reconhecida pelo
 * MAC e o cadastro se corrige sozinho.
 */
describe("planejarReconciliacao", () => {
  const MAC_A = "00:1a:2b:3c:4d:01";
  const MAC_B = "00:1a:2b:3c:4d:02";
  const balanca = (id: string, ip: string, mac: string | null = null): DeviceRegistrado => ({
    id,
    nome: `Balança ${id}`,
    ip,
    porta: 33581,
    mac,
  });

  it("religou e pegou outro IP: atualiza pelo MAC", () => {
    const plano = planejarReconciliacao(
      [balanca("a", "192.168.15.6", MAC_A), balanca("b", "192.168.15.7", MAC_B)],
      [
        { ip: "192.168.15.23", port: 33581, mac: MAC_A },
        { ip: "192.168.15.7", port: 33581, mac: MAC_B },
      ],
    );
    expect(plano.novosIps).toEqual([{ deviceId: "a", nome: "Balança a", de: "192.168.15.6", para: "192.168.15.23" }]);
  });

  it("balança já cadastrada sem MAC aprende o MAC no IP atual, sem mexer no IP", () => {
    const plano = planejarReconciliacao([balanca("a", "192.168.15.6")], [
      { ip: "192.168.15.6", port: 33581, mac: MAC_A },
    ]);
    expect(plano.macsAprendidos).toEqual([{ deviceId: "a", nome: "Balança a", mac: MAC_A }]);
    expect(plano.novosIps).toEqual([]);
  });

  it("duas balanças que trocaram de IP entre si são atualizadas juntas", () => {
    const plano = planejarReconciliacao(
      [balanca("a", "192.168.15.6", MAC_A), balanca("b", "192.168.15.7", MAC_B)],
      [
        { ip: "192.168.15.7", port: 33581, mac: MAC_A },
        { ip: "192.168.15.6", port: 33581, mac: MAC_B },
      ],
    );
    expect(plano.novosIps.map((n) => [n.deviceId, n.para])).toEqual([
      ["a", "192.168.15.7"],
      ["b", "192.168.15.6"],
    ]);
  });

  it("não toma o IP que ainda está cadastrado para outra balança que não se moveu", () => {
    const plano = planejarReconciliacao(
      [balanca("a", "192.168.15.6", MAC_A), balanca("b", "192.168.15.7", MAC_B)],
      [{ ip: "192.168.15.7", port: 33581, mac: MAC_A }],
    );
    expect(plano.novosIps).toEqual([]);
    expect(plano.ignorados).toHaveLength(1);
  });

  it("IP cadastrado respondendo com outro MAC não é corrigido sozinho", () => {
    const plano = planejarReconciliacao([balanca("a", "192.168.15.6", MAC_A)], [
      { ip: "192.168.15.6", port: 33581, mac: MAC_B },
    ]);
    expect(plano.novosIps).toEqual([]);
    expect(plano.macsAprendidos).toEqual([]);
    expect(plano.ignorados).toHaveLength(1);
  });

  it("mesmo MAC em dois IPs é ignorado", () => {
    const plano = planejarReconciliacao([balanca("a", "192.168.15.6", MAC_A)], [
      { ip: "192.168.15.20", port: 33581, mac: MAC_A },
      { ip: "192.168.15.21", port: 33581, mac: MAC_A },
    ]);
    expect(plano.novosIps).toEqual([]);
  });

  describe("cadastro que já está com o IP errado", () => {
    it("caso real de produção: cadastrada no .8, balança anunciando do .9 com MAC — corrige e aprende o MAC", () => {
      const plano = planejarReconciliacao([balanca("a", "192.168.15.8")], [
        { ip: "192.168.15.9", port: 33581, mac: "28:6d:cd:ca:c7:e2" },
      ]);
      expect(plano.novosIps).toEqual([{ deviceId: "a", nome: "Balança a", de: "192.168.15.8", para: "192.168.15.9" }]);
      expect(plano.macsAprendidos).toEqual([{ deviceId: "a", nome: "Balança a", mac: "28:6d:cd:ca:c7:e2" }]);
    });

    it("com duas balanças sem dono anunciando, não escolhe", () => {
      const plano = planejarReconciliacao([balanca("a", "192.168.15.8")], [
        { ip: "192.168.15.9", port: 33581, mac: MAC_A },
        { ip: "192.168.15.11", port: 33581, mac: MAC_B },
      ]);
      expect(plano.novosIps).toEqual([]);
    });

    it("uma balança identificada pelo MAC não é oferecida ao cadastro órfão", () => {
      const plano = planejarReconciliacao(
        [balanca("a", "192.168.15.6", MAC_A), balanca("b", "192.168.15.8")],
        [
          { ip: "192.168.15.6", port: 33581, mac: MAC_A },
          { ip: "192.168.15.9", port: 33581, mac: MAC_B },
        ],
      );
      expect(plano.novosIps).toEqual([{ deviceId: "b", nome: "Balança b", de: "192.168.15.8", para: "192.168.15.9" }]);
      expect(plano.macsAprendidos).toEqual([{ deviceId: "b", nome: "Balança b", mac: MAC_B }]);
    });
  });

  describe("agente antigo, sem MAC", () => {
    it("mantém a regra anterior: uma balança, uma candidata na mesma porta", () => {
      const plano = planejarReconciliacao([balanca("a", "192.168.15.6")], [{ ip: "192.168.15.23", port: 33581 }]);
      expect(plano.novosIps.map((n) => n.para)).toEqual(["192.168.15.23"]);
    });

    it("com mais de uma balança cadastrada não adivinha", () => {
      const plano = planejarReconciliacao(
        [balanca("a", "192.168.15.6"), balanca("b", "192.168.15.7")],
        [{ ip: "192.168.15.23", port: 33581 }],
      );
      expect(plano.novosIps).toEqual([]);
    });

    it("balança ainda respondendo no IP cadastrado não é movida", () => {
      const plano = planejarReconciliacao(
        [balanca("a", "192.168.15.6")],
        [
          { ip: "192.168.15.6", port: 33581 },
          { ip: "192.168.15.23", port: 33581 },
        ],
      );
      expect(plano.novosIps).toEqual([]);
    });
  });
});
