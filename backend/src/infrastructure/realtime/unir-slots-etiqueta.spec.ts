import { unirSlotsEtiqueta } from "./agent.gateway";

/**
 * União do mapa de slots de etiqueta (card #59).
 *
 * O `UPL/LAB` da balança é incompleto e varia entre chamadas — o mesmo
 * equipamento devolveu 65, 64, 54 e 52 registros em leituras seguidas, duas
 * delas sinalizando fim com `END\tLAB`. Se o mapa fosse substituído a cada
 * relatório, um slot ocupado sumiria por truncamento e o cadastro passaria a
 * oferecê-lo como livre — exatamente o erro que o card #55 existe pra evitar.
 */
describe("unirSlotsEtiqueta", () => {
  // A regressão que este teste trava.
  it("preserva slot que sumiu do dump por truncamento", () => {
    const conhecidos = [
      { numero: 23, nome: "Etiqueta de producao" },
      { numero: 40, nome: "Avulso" },
    ];
    expect(unirSlotsEtiqueta(conhecidos, [{ numero: 40, nome: "Avulso" }])).toEqual(conhecidos);
  });

  it("atualiza o nome quando o slot foi regravado", () => {
    expect(
      unirSlotsEtiqueta([{ numero: 23, nome: "Nome antigo" }], [{ numero: 23, nome: "Nome novo" }]),
    ).toEqual([{ numero: 23, nome: "Nome novo" }]);
  });

  it("acrescenta slots novos ao que já era conhecido, em ordem", () => {
    expect(
      unirSlotsEtiqueta([{ numero: 60, nome: "Novo" }], [{ numero: 1, nome: "PF-1" }]),
    ).toEqual([
      { numero: 1, nome: "PF-1" },
      { numero: 60, nome: "Novo" },
    ]);
  });

  it("parte do zero quando nunca houve leitura", () => {
    expect(unirSlotsEtiqueta(null, [{ numero: 1, nome: "PF-1" }])).toEqual([
      { numero: 1, nome: "PF-1" },
    ]);
  });

  // A coluna é Json: o banco não garante forma. Um registro torto não pode
  // derrubar o mapa inteiro.
  it("ignora registro malformado sem perder os válidos", () => {
    expect(
      unirSlotsEtiqueta([{ numero: "x" }, { nome: "sem numero" }, { numero: 7, nome: "Bom" }], []),
    ).toEqual([{ numero: 7, nome: "Bom" }]);
  });
});
