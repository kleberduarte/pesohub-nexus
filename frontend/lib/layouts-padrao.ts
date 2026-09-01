// GERADO por backend/scripts/importar-layout-ramuza.ts --catalogo — não editar à mão.
// Origem: tabelas Label/LabelItem do ECS.mdb do software oficial da Ramuza,
// extraídas por backend/scripts/extrair-layouts-ramuza.ps1.

export interface LayoutPadrao {
  id: string;
  nome: string;
  larguraMm: number;
  alturaMm: number;
  elementos: Array<Record<string, unknown>>;
}

export const LAYOUTS_PADRAO: LayoutPadrao[] = [
  {
    "id": "ramuza-10-60x40-glaceado-padrão",
    "nome": "60x40 GLACEADO Padrão",
    "larguraMm": 56,
    "alturaMm": 40,
    "elementos": [
      {
        "id": "nome-ramuza10-1",
        "tipo": "nome",
        "x": 3.38,
        "y": 0.88,
        "largura": 49.75,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza10-2",
        "tipo": "borda",
        "x": 3.5,
        "y": 5.5,
        "largura": 49.5,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "texto-ramuza10-3",
        "tipo": "texto",
        "x": 0,
        "y": 6.38,
        "largura": 11.5,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Glaceado:"
      },
      {
        "id": "texto-ramuza10-5",
        "tipo": "texto",
        "x": 15.88,
        "y": 6.38,
        "largura": 2,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "="
      },
      {
        "id": "texto-ramuza10-7",
        "tipo": "texto",
        "x": 24.63,
        "y": 6.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza10-8",
        "tipo": "texto",
        "x": 28.13,
        "y": 6.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza10-9",
        "tipo": "texto",
        "x": 39.25,
        "y": 6.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza10-10",
        "tipo": "tara",
        "x": 42.25,
        "y": 6.5,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza10-11",
        "tipo": "texto",
        "x": 52.13,
        "y": 6.5,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza10-12",
        "tipo": "texto",
        "x": 0.25,
        "y": 9.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "peso-ramuza10-13",
        "tipo": "peso",
        "x": 42.38,
        "y": 9.38,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza10-15",
        "tipo": "texto",
        "x": 52.13,
        "y": 9.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "dataEmbalagem-ramuza10-16",
        "tipo": "dataEmbalagem",
        "x": 3.25,
        "y": 9.5,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza10-18",
        "tipo": "texto",
        "x": 28.25,
        "y": 9.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza10-19",
        "tipo": "pesoBrutoLiquido",
        "x": 39.38,
        "y": 9.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza10-20",
        "tipo": "texto",
        "x": 0.25,
        "y": 12.38,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza10-22",
        "tipo": "validade",
        "x": 3.13,
        "y": 12.5,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza10-23",
        "tipo": "texto",
        "x": 28.25,
        "y": 12.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza10-28",
        "tipo": "texto",
        "x": 39.38,
        "y": 12.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza10-30",
        "tipo": "precoUnitario",
        "x": 40.75,
        "y": 12.5,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza10-32",
        "tipo": "codigoBarras",
        "x": 0.38,
        "y": 16.63,
        "largura": 24.25,
        "altura": 11,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza10-33",
        "tipo": "borda",
        "x": 31.25,
        "y": 16.63,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza10-34",
        "tipo": "borda",
        "x": 31.25,
        "y": 16.63,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza10-35",
        "tipo": "borda",
        "x": 31.25,
        "y": 16.63,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza10-36",
        "tipo": "borda",
        "x": 31.25,
        "y": 16.63,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza10-37",
        "tipo": "borda",
        "x": 49.88,
        "y": 16.63,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza10-38",
        "tipo": "borda",
        "x": 53.75,
        "y": 16.63,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza10-39",
        "tipo": "texto",
        "x": 38.25,
        "y": 16.88,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza10-40",
        "tipo": "texto",
        "x": 44,
        "y": 16.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza10-41",
        "tipo": "preco",
        "x": 37.13,
        "y": 21,
        "largura": 12,
        "altura": 4.5,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "ingredientes-ramuza10-42",
        "tipo": "ingredientes",
        "x": 0,
        "y": 27.75,
        "largura": 56,
        "altura": 12.25,
        "alinhamento": 2,
        "fonte": 13
      }
    ]
  },
  {
    "id": "ramuza-11-60x40-drenado-padrão",
    "nome": "60x40 DRENADO Padrão",
    "larguraMm": 56,
    "alturaMm": 40,
    "elementos": [
      {
        "id": "nome-ramuza11-1",
        "tipo": "nome",
        "x": 3.38,
        "y": 0.88,
        "largura": 49.75,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza11-2",
        "tipo": "borda",
        "x": 3.5,
        "y": 5.5,
        "largura": 49.5,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "texto-ramuza11-3",
        "tipo": "texto",
        "x": 0,
        "y": 6.38,
        "largura": 11.5,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Drenado:"
      },
      {
        "id": "texto-ramuza11-5",
        "tipo": "texto",
        "x": 15.88,
        "y": 6.38,
        "largura": 2,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "="
      },
      {
        "id": "texto-ramuza11-7",
        "tipo": "texto",
        "x": 24.63,
        "y": 6.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza11-8",
        "tipo": "texto",
        "x": 28.13,
        "y": 6.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza11-9",
        "tipo": "texto",
        "x": 39.25,
        "y": 6.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza11-10",
        "tipo": "tara",
        "x": 42.25,
        "y": 6.5,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza11-11",
        "tipo": "texto",
        "x": 52.13,
        "y": 6.5,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza11-12",
        "tipo": "texto",
        "x": 0.25,
        "y": 9.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "peso-ramuza11-13",
        "tipo": "peso",
        "x": 42.38,
        "y": 9.38,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza11-15",
        "tipo": "texto",
        "x": 52.13,
        "y": 9.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "dataEmbalagem-ramuza11-16",
        "tipo": "dataEmbalagem",
        "x": 3.25,
        "y": 9.5,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza11-18",
        "tipo": "texto",
        "x": 28.25,
        "y": 9.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza11-19",
        "tipo": "pesoBrutoLiquido",
        "x": 39.38,
        "y": 9.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza11-20",
        "tipo": "texto",
        "x": 0.25,
        "y": 12.38,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza11-22",
        "tipo": "validade",
        "x": 3.13,
        "y": 12.5,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza11-23",
        "tipo": "texto",
        "x": 28.25,
        "y": 12.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza11-28",
        "tipo": "texto",
        "x": 39.38,
        "y": 12.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza11-30",
        "tipo": "precoUnitario",
        "x": 40.75,
        "y": 12.5,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza11-32",
        "tipo": "codigoBarras",
        "x": 0.38,
        "y": 16.63,
        "largura": 24.25,
        "altura": 11,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza11-33",
        "tipo": "borda",
        "x": 31.25,
        "y": 16.63,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza11-34",
        "tipo": "borda",
        "x": 31.25,
        "y": 16.63,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza11-35",
        "tipo": "borda",
        "x": 31.25,
        "y": 16.63,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza11-36",
        "tipo": "borda",
        "x": 31.25,
        "y": 16.63,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza11-37",
        "tipo": "borda",
        "x": 49.88,
        "y": 16.63,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza11-38",
        "tipo": "borda",
        "x": 53.75,
        "y": 16.63,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza11-39",
        "tipo": "texto",
        "x": 38.25,
        "y": 16.88,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza11-40",
        "tipo": "texto",
        "x": 44,
        "y": 16.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza11-41",
        "tipo": "preco",
        "x": 37.13,
        "y": 21,
        "largura": 12,
        "altura": 4.5,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "ingredientes-ramuza11-42",
        "tipo": "ingredientes",
        "x": 0,
        "y": 27.75,
        "largura": 56,
        "altura": 12.25,
        "alinhamento": 2,
        "fonte": 13
      }
    ]
  },
  {
    "id": "ramuza-15-modelo-com-tabela-60x120",
    "nome": "Modelo com tabela 60x120",
    "larguraMm": 56,
    "alturaMm": 120,
    "elementos": [
      {
        "id": "nome-ramuza15-1",
        "tipo": "nome",
        "x": 0.13,
        "y": 0,
        "largura": 49.75,
        "altura": 3.75,
        "fonte": 4
      },
      {
        "id": "divisoria-ramuza15-2",
        "tipo": "divisoria",
        "x": 2.5,
        "y": 4,
        "largura": 25,
        "altura": 6.25,
        "fonte": 2
      },
      {
        "id": "codigoBarras-ramuza15-3",
        "tipo": "codigoBarras",
        "x": 8.75,
        "y": 4.25,
        "largura": 26.5,
        "altura": 8.75,
        "angulo": 90,
        "alinhamento": 1,
        "fonte": 1
      },
      {
        "id": "texto-ramuza15-4",
        "tipo": "texto",
        "x": 22.5,
        "y": 4.25,
        "largura": 14.75,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza15-5",
        "tipo": "texto",
        "x": 37.38,
        "y": 4.25,
        "largura": 4,
        "altura": 2.63,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza15-6",
        "tipo": "tara",
        "x": 41.25,
        "y": 4.25,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza15-7",
        "tipo": "texto",
        "x": 50.5,
        "y": 4.25,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza15-8",
        "tipo": "texto",
        "x": 12.63,
        "y": 4.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza15-10",
        "tipo": "dataEmbalagem",
        "x": 11.5,
        "y": 7,
        "largura": 11.38,
        "altura": 2.38,
        "alinhamento": 1,
        "fonte": 4
      },
      {
        "id": "texto-ramuza15-11",
        "tipo": "texto",
        "x": 23.63,
        "y": 7,
        "largura": 13.5,
        "altura": 2.5,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Peso"
      },
      {
        "id": "pesoBrutoLiquido-ramuza15-13",
        "tipo": "pesoBrutoLiquido",
        "x": 37.63,
        "y": 7,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "peso-ramuza15-14",
        "tipo": "peso",
        "x": 41.38,
        "y": 7,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza15-15",
        "tipo": "texto",
        "x": 50.5,
        "y": 7,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza15-19",
        "tipo": "texto",
        "x": 12.38,
        "y": 10,
        "largura": 25,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Preço/kg"
      },
      {
        "id": "texto-ramuza15-20",
        "tipo": "texto",
        "x": 39.13,
        "y": 10,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza15-21",
        "tipo": "precoUnitario",
        "x": 41.25,
        "y": 10,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza15-22",
        "tipo": "texto",
        "x": 12.5,
        "y": 10.63,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Validade:"
      },
      {
        "id": "texto-ramuza15-23",
        "tipo": "texto",
        "x": 12.38,
        "y": 13,
        "largura": 25,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Lote:"
      },
      {
        "id": "lote-ramuza15-25",
        "tipo": "lote",
        "x": 29,
        "y": 13,
        "largura": 25,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "validade-ramuza15-30",
        "tipo": "validade",
        "x": 10.88,
        "y": 13.63,
        "largura": 12.38,
        "altura": 2.38,
        "alinhamento": 1,
        "fonte": 4
      },
      {
        "id": "preco-ramuza15-31",
        "tipo": "preco",
        "x": 25.75,
        "y": 16.63,
        "largura": 12,
        "altura": 2.5,
        "fonte": 8
      },
      {
        "id": "texto-ramuza15-32",
        "tipo": "texto",
        "x": 11.25,
        "y": 17.13,
        "largura": 9.88,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 4,
        "texto": "Total:"
      },
      {
        "id": "texto-ramuza15-33",
        "tipo": "texto",
        "x": 19.75,
        "y": 17.13,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "ingredientes-ramuza15-34",
        "tipo": "ingredientes",
        "x": 9.88,
        "y": 20,
        "largura": 56,
        "altura": 18.75,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "ingredientes-ramuza15-36",
        "tipo": "ingredientes",
        "x": 9.5,
        "y": 35.38,
        "largura": 46,
        "altura": 14,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "selos-ramuza15-42",
        "tipo": "selos",
        "x": 0,
        "y": 49.75,
        "largura": 49.75,
        "altura": 14,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "tabelaNutricional-ramuza15-44",
        "tipo": "tabelaNutricional",
        "x": 0,
        "y": 62.88,
        "largura": 56,
        "altura": 30.88,
        "alinhamento": 2,
        "fonte": 8
      }
    ]
  },
  {
    "id": "ramuza-19-modelo-com-tabela-60x170",
    "nome": "Modelo com tabela 60x170",
    "larguraMm": 56,
    "alturaMm": 170,
    "elementos": [
      {
        "id": "nome-ramuza19-1",
        "tipo": "nome",
        "x": 0.13,
        "y": 0,
        "largura": 49.75,
        "altura": 3.75,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza19-5",
        "tipo": "codigoBarras",
        "x": 0.63,
        "y": 3.75,
        "largura": 51,
        "altura": 7.13,
        "alinhamento": 1,
        "fonte": 1
      },
      {
        "id": "texto-ramuza19-7",
        "tipo": "texto",
        "x": 22.5,
        "y": 11.63,
        "largura": 14.75,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza19-8",
        "tipo": "texto",
        "x": 37.38,
        "y": 11.63,
        "largura": 4,
        "altura": 2.63,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza19-9",
        "tipo": "tara",
        "x": 41.25,
        "y": 11.63,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza19-10",
        "tipo": "texto",
        "x": 50.38,
        "y": 11.63,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza19-11",
        "tipo": "texto",
        "x": 0,
        "y": 11.88,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza19-12",
        "tipo": "dataEmbalagem",
        "x": 7.25,
        "y": 11.88,
        "largura": 21,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza19-15",
        "tipo": "texto",
        "x": 23.63,
        "y": 14.38,
        "largura": 13.5,
        "altura": 2.5,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Peso"
      },
      {
        "id": "pesoBrutoLiquido-ramuza19-16",
        "tipo": "pesoBrutoLiquido",
        "x": 37.63,
        "y": 14.38,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "peso-ramuza19-17",
        "tipo": "peso",
        "x": 41.38,
        "y": 14.38,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza19-18",
        "tipo": "texto",
        "x": 50.5,
        "y": 14.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza19-19",
        "tipo": "texto",
        "x": 0,
        "y": 15.63,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza19-22",
        "tipo": "validade",
        "x": 7.25,
        "y": 15.75,
        "largura": 21,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza19-23",
        "tipo": "texto",
        "x": 12.38,
        "y": 17.38,
        "largura": 25,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Preço/kg"
      },
      {
        "id": "texto-ramuza19-25",
        "tipo": "texto",
        "x": 39.13,
        "y": 17.38,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza19-28",
        "tipo": "precoUnitario",
        "x": 41.25,
        "y": 17.38,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "borda-ramuza19-29",
        "tipo": "borda",
        "x": 35.75,
        "y": 20.75,
        "largura": 16.63,
        "altura": 9.75,
        "espessura": 6,
        "fonte": 1
      },
      {
        "id": "imagem-ramuza19-30",
        "tipo": "imagem",
        "x": 17.38,
        "y": 20.88,
        "largura": 15.25,
        "altura": 9.38,
        "alinhamento": 1,
        "fonte": 1
      },
      {
        "id": "texto-ramuza19-32",
        "tipo": "texto",
        "x": 36.75,
        "y": 21.38,
        "largura": 9.88,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 4,
        "texto": "Total:"
      },
      {
        "id": "texto-ramuza19-33",
        "tipo": "texto",
        "x": 46.63,
        "y": 22,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza19-34",
        "tipo": "preco",
        "x": 37.88,
        "y": 24.63,
        "largura": 12,
        "altura": 4.5,
        "fonte": 4
      },
      {
        "id": "ingredientes-ramuza19-36",
        "tipo": "ingredientes",
        "x": 0.5,
        "y": 30.75,
        "largura": 56,
        "altura": 20.88,
        "alinhamento": 2,
        "fonte": 13
      },
      {
        "id": "tabelaNutricional-ramuza19-42",
        "tipo": "tabelaNutricional",
        "x": 0,
        "y": 53.25,
        "largura": 56,
        "altura": 45.38,
        "alinhamento": 2,
        "fonte": 8
      },
      {
        "id": "selos-ramuza19-44",
        "tipo": "selos",
        "x": 0,
        "y": 98.75,
        "largura": 49.75,
        "altura": 8.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza19-46",
        "tipo": "texto",
        "x": 0,
        "y": 107.75,
        "largura": 55.25,
        "altura": 6.25,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Ramuza Ind. Com. de Balanças LTDA"
      }
    ]
  },
  {
    "id": "ramuza-4-60x80-padrão",
    "nome": "60x80 Padrão",
    "larguraMm": 58,
    "alturaMm": 79,
    "elementos": [
      {
        "id": "nome-ramuza4-1",
        "tipo": "nome",
        "x": 3.38,
        "y": 0.5,
        "largura": 49.75,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza4-2",
        "tipo": "borda",
        "x": 1.63,
        "y": 5.13,
        "largura": 55,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "codigoBarras-ramuza4-3",
        "tipo": "codigoBarras",
        "x": 1.75,
        "y": 6.75,
        "largura": 24.25,
        "altura": 11,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza4-4",
        "tipo": "borda",
        "x": 29.38,
        "y": 6.75,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza4-5",
        "tipo": "borda",
        "x": 29.38,
        "y": 6.75,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza4-6",
        "tipo": "borda",
        "x": 29.38,
        "y": 6.75,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza4-7",
        "tipo": "borda",
        "x": 29.38,
        "y": 6.75,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza4-8",
        "tipo": "borda",
        "x": 48,
        "y": 6.75,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza4-9",
        "tipo": "borda",
        "x": 51.88,
        "y": 6.75,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza4-10",
        "tipo": "texto",
        "x": 36.38,
        "y": 7.13,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza4-11",
        "tipo": "texto",
        "x": 42.13,
        "y": 7.13,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza4-12",
        "tipo": "preco",
        "x": 35.25,
        "y": 11.13,
        "largura": 12,
        "altura": 4.5,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "texto-ramuza4-13",
        "tipo": "texto",
        "x": 2,
        "y": 18.88,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "texto-ramuza4-14",
        "tipo": "texto",
        "x": 25.5,
        "y": 18.88,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza4-15",
        "tipo": "texto",
        "x": 37.75,
        "y": 18.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza4-16",
        "tipo": "tara",
        "x": 40.75,
        "y": 18.88,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza4-17",
        "tipo": "texto",
        "x": 50.63,
        "y": 18.88,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "dataEmbalagem-ramuza4-18",
        "tipo": "dataEmbalagem",
        "x": 5,
        "y": 19,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "peso-ramuza4-19",
        "tipo": "peso",
        "x": 40.88,
        "y": 21.75,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza4-22",
        "tipo": "texto",
        "x": 50.63,
        "y": 21.75,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza4-23",
        "tipo": "texto",
        "x": 2,
        "y": 21.88,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "texto-ramuza4-25",
        "tipo": "texto",
        "x": 25.5,
        "y": 21.88,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza4-30",
        "tipo": "pesoBrutoLiquido",
        "x": 37.88,
        "y": 21.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "validade-ramuza4-32",
        "tipo": "validade",
        "x": 4.88,
        "y": 22,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza4-34",
        "tipo": "texto",
        "x": 25.5,
        "y": 24.88,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza4-35",
        "tipo": "texto",
        "x": 37.88,
        "y": 24.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza4-36",
        "tipo": "precoUnitario",
        "x": 39.25,
        "y": 24.88,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "borda-ramuza4-39",
        "tipo": "borda",
        "x": 1.63,
        "y": 28.63,
        "largura": 55.13,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "ingredientes-ramuza4-40",
        "tipo": "ingredientes",
        "x": 0,
        "y": 31,
        "largura": 56,
        "altura": 11.63,
        "alinhamento": 2,
        "fonte": 13
      },
      {
        "id": "borda-ramuza4-42",
        "tipo": "borda",
        "x": 1.63,
        "y": 45,
        "largura": 56.63,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "selos-ramuza4-43",
        "tipo": "selos",
        "x": 1.63,
        "y": 47.75,
        "largura": 51,
        "altura": 10.25,
        "alinhamento": 2,
        "fonte": 5
      },
      {
        "id": "borda-ramuza4-45",
        "tipo": "borda",
        "x": 1.63,
        "y": 60.63,
        "largura": 56.63,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 1
      }
    ]
  },
  {
    "id": "ramuza-6-60x40-padrão",
    "nome": "60x40 Padrão",
    "larguraMm": 56,
    "alturaMm": 40,
    "elementos": [
      {
        "id": "nome-ramuza6-1",
        "tipo": "nome",
        "x": 3.38,
        "y": 0.88,
        "largura": 49.75,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza6-2",
        "tipo": "borda",
        "x": 3.5,
        "y": 5.5,
        "largura": 49.5,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "texto-ramuza6-3",
        "tipo": "texto",
        "x": 25.5,
        "y": 6.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza6-4",
        "tipo": "texto",
        "x": 37.75,
        "y": 6.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza6-5",
        "tipo": "tara",
        "x": 40.75,
        "y": 6.5,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza6-6",
        "tipo": "texto",
        "x": 50.63,
        "y": 6.5,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza6-7",
        "tipo": "texto",
        "x": 2,
        "y": 9.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "peso-ramuza6-8",
        "tipo": "peso",
        "x": 40.88,
        "y": 9.38,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza6-10",
        "tipo": "texto",
        "x": 50.63,
        "y": 9.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "dataEmbalagem-ramuza6-11",
        "tipo": "dataEmbalagem",
        "x": 5,
        "y": 9.5,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza6-12",
        "tipo": "texto",
        "x": 25.5,
        "y": 9.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza6-14",
        "tipo": "pesoBrutoLiquido",
        "x": 37.88,
        "y": 9.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza6-15",
        "tipo": "texto",
        "x": 2,
        "y": 12.38,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza6-16",
        "tipo": "validade",
        "x": 4.88,
        "y": 12.5,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza6-18",
        "tipo": "texto",
        "x": 25.5,
        "y": 12.5,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza6-19",
        "tipo": "texto",
        "x": 37.88,
        "y": 12.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza6-20",
        "tipo": "precoUnitario",
        "x": 39.25,
        "y": 12.5,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza6-22",
        "tipo": "codigoBarras",
        "x": 0.38,
        "y": 16.63,
        "largura": 24.25,
        "altura": 11,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza6-23",
        "tipo": "borda",
        "x": 29.75,
        "y": 16.63,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza6-25",
        "tipo": "borda",
        "x": 29.75,
        "y": 16.63,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza6-28",
        "tipo": "borda",
        "x": 29.75,
        "y": 16.63,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza6-30",
        "tipo": "borda",
        "x": 29.75,
        "y": 16.63,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza6-32",
        "tipo": "borda",
        "x": 48.38,
        "y": 16.63,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza6-33",
        "tipo": "borda",
        "x": 52.25,
        "y": 16.63,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza6-34",
        "tipo": "texto",
        "x": 36.75,
        "y": 16.88,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza6-35",
        "tipo": "texto",
        "x": 42.5,
        "y": 16.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza6-36",
        "tipo": "preco",
        "x": 35.63,
        "y": 21,
        "largura": 12,
        "altura": 4.5,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "ingredientes-ramuza6-37",
        "tipo": "ingredientes",
        "x": 0,
        "y": 27.75,
        "largura": 56,
        "altura": 12.25,
        "alinhamento": 2,
        "fonte": 13
      }
    ]
  },
  {
    "id": "ramuza-7-60x30-padrão",
    "nome": "60x30 Padrão",
    "larguraMm": 56,
    "alturaMm": 30,
    "elementos": [
      {
        "id": "nome-ramuza7-1",
        "tipo": "nome",
        "x": 3.38,
        "y": 0.88,
        "largura": 49.75,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza7-2",
        "tipo": "borda",
        "x": 3.5,
        "y": 5.5,
        "largura": 49.5,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "texto-ramuza7-3",
        "tipo": "texto",
        "x": 25.5,
        "y": 7.13,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza7-4",
        "tipo": "texto",
        "x": 37.75,
        "y": 7.13,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza7-5",
        "tipo": "tara",
        "x": 40.75,
        "y": 7.13,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza7-6",
        "tipo": "texto",
        "x": 50.63,
        "y": 7.13,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza7-7",
        "tipo": "texto",
        "x": 2,
        "y": 10,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "peso-ramuza7-8",
        "tipo": "peso",
        "x": 40.88,
        "y": 10,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza7-10",
        "tipo": "texto",
        "x": 50.63,
        "y": 10,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "dataEmbalagem-ramuza7-11",
        "tipo": "dataEmbalagem",
        "x": 5,
        "y": 10.13,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza7-12",
        "tipo": "texto",
        "x": 25.5,
        "y": 10.13,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza7-14",
        "tipo": "pesoBrutoLiquido",
        "x": 37.88,
        "y": 10.13,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza7-15",
        "tipo": "texto",
        "x": 2,
        "y": 13,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza7-16",
        "tipo": "validade",
        "x": 4.88,
        "y": 13.13,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza7-18",
        "tipo": "texto",
        "x": 25.5,
        "y": 13.13,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza7-19",
        "tipo": "texto",
        "x": 37.88,
        "y": 13.13,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza7-20",
        "tipo": "precoUnitario",
        "x": 39.25,
        "y": 13.13,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza7-22",
        "tipo": "codigoBarras",
        "x": 0.38,
        "y": 17.25,
        "largura": 24.25,
        "altura": 11,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza7-23",
        "tipo": "borda",
        "x": 29.63,
        "y": 17.25,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza7-25",
        "tipo": "borda",
        "x": 29.63,
        "y": 17.25,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza7-28",
        "tipo": "borda",
        "x": 29.63,
        "y": 17.25,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza7-30",
        "tipo": "borda",
        "x": 29.63,
        "y": 17.25,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza7-32",
        "tipo": "borda",
        "x": 48.25,
        "y": 17.25,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza7-33",
        "tipo": "borda",
        "x": 52.13,
        "y": 17.25,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza7-34",
        "tipo": "texto",
        "x": 36.63,
        "y": 17.5,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza7-35",
        "tipo": "texto",
        "x": 42.38,
        "y": 17.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza7-36",
        "tipo": "preco",
        "x": 35.5,
        "y": 21.63,
        "largura": 12,
        "altura": 4.5,
        "alinhamento": 1,
        "fonte": 11
      }
    ]
  },
  {
    "id": "ramuza-9-30x30-padrão",
    "nome": "30x30 Padrão",
    "larguraMm": 30,
    "alturaMm": 30,
    "elementos": [
      {
        "id": "nome-ramuza9-1",
        "tipo": "nome",
        "x": 0.63,
        "y": 0.5,
        "largura": 22.25,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 7
      },
      {
        "id": "borda-ramuza9-2",
        "tipo": "borda",
        "x": 0.63,
        "y": 4.63,
        "largura": 22.25,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "codigoBarras-ramuza9-3",
        "tipo": "codigoBarras",
        "x": 30,
        "y": 5.25,
        "largura": 11.75,
        "altura": 7.13,
        "angulo": 90,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "texto-ramuza9-4",
        "tipo": "texto",
        "x": 1,
        "y": 5.5,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza9-5",
        "tipo": "dataEmbalagem",
        "x": 13.5,
        "y": 5.63,
        "largura": 8.38,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza9-6",
        "tipo": "texto",
        "x": 1,
        "y": 8.13,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza9-7",
        "tipo": "validade",
        "x": 13.5,
        "y": 8.25,
        "largura": 8.38,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza9-8",
        "tipo": "texto",
        "x": 1,
        "y": 13.25,
        "largura": 8.13,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza9-9",
        "tipo": "texto",
        "x": 8.88,
        "y": 13.25,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza9-10",
        "tipo": "tara",
        "x": 10.63,
        "y": 13.25,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza9-11",
        "tipo": "texto",
        "x": 20.5,
        "y": 13.5,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 1,
        "texto": "kg"
      },
      {
        "id": "peso-ramuza9-13",
        "tipo": "peso",
        "x": 10.75,
        "y": 15.75,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza9-15",
        "tipo": "texto",
        "x": 1,
        "y": 15.88,
        "largura": 8.13,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza9-16",
        "tipo": "pesoBrutoLiquido",
        "x": 9,
        "y": 15.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza9-17",
        "tipo": "texto",
        "x": 20.5,
        "y": 16,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 1,
        "texto": "kg"
      },
      {
        "id": "precoUnitario-ramuza9-18",
        "tipo": "precoUnitario",
        "x": 12.25,
        "y": 18.38,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza9-20",
        "tipo": "texto",
        "x": 1,
        "y": 18.5,
        "largura": 8.25,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza9-22",
        "tipo": "texto",
        "x": 11.5,
        "y": 18.5,
        "largura": 4,
        "altura": 2.88,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "texto-ramuza9-23",
        "tipo": "texto",
        "x": 11.88,
        "y": 21.75,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 2,
        "texto": "R$"
      },
      {
        "id": "borda-ramuza9-25",
        "tipo": "borda",
        "x": 2.38,
        "y": 21.88,
        "largura": 1.13,
        "altura": 7.63,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza9-28",
        "tipo": "borda",
        "x": 2.38,
        "y": 21.88,
        "largura": 5,
        "altura": 2.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza9-30",
        "tipo": "borda",
        "x": 2.38,
        "y": 21.88,
        "largura": 18.63,
        "altura": 2.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza9-32",
        "tipo": "borda",
        "x": 2.38,
        "y": 21.88,
        "largura": 18.63,
        "altura": 7.63,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza9-33",
        "tipo": "borda",
        "x": 16,
        "y": 21.88,
        "largura": 5,
        "altura": 2.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza9-34",
        "tipo": "borda",
        "x": 19.88,
        "y": 21.88,
        "largura": 1.13,
        "altura": 7.63,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza9-35",
        "tipo": "texto",
        "x": 7.13,
        "y": 22,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 2,
        "texto": "Total"
      },
      {
        "id": "preco-ramuza9-36",
        "tipo": "preco",
        "x": 5.5,
        "y": 24.75,
        "largura": 12,
        "altura": 2.88,
        "alinhamento": 1,
        "fonte": 8
      }
    ]
  }
];
