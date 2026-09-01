// GERADO por backend/scripts/importar-layout-ramuza.ts --catalogo — não editar à mão.
// Origem: tabelas Label/LabelItem do ECS.mdb do software oficial da Ramuza,
// extraídas por backend/scripts/extrair-layouts-ramuza.ps1.
// Os modelos com id `pesohub-*` são variantes declaradas em
// backend/scripts/layouts-padrao-extras.json — combinações que as lojas pedem e
// que não existem nos modelos de fábrica.

export interface LayoutPadrao {
  id: string;
  nome: string;
  larguraMm: number;
  alturaMm: number;
  elementos: Array<Record<string, unknown>>;
}

export const LAYOUTS_PADRAO: LayoutPadrao[] = [
  {
    "id": "ramuza-1-60x60-padrão",
    "nome": "60x60 Padrão ",
    "larguraMm": 58,
    "alturaMm": 60,
    "elementos": [
      {
        "id": "nome-ramuza1-1",
        "tipo": "nome",
        "x": 3.38,
        "y": 0.5,
        "largura": 49.75,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza1-2",
        "tipo": "borda",
        "x": 1.63,
        "y": 5.13,
        "largura": 55,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "codigoBarras-ramuza1-3",
        "tipo": "codigoBarras",
        "x": 1.75,
        "y": 6.75,
        "largura": 24.25,
        "altura": 11,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza1-4",
        "tipo": "borda",
        "x": 29.38,
        "y": 6.75,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza1-5",
        "tipo": "borda",
        "x": 29.38,
        "y": 6.75,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza1-6",
        "tipo": "borda",
        "x": 29.38,
        "y": 6.75,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza1-7",
        "tipo": "borda",
        "x": 29.38,
        "y": 6.75,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza1-8",
        "tipo": "borda",
        "x": 48,
        "y": 6.75,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza1-9",
        "tipo": "borda",
        "x": 51.88,
        "y": 6.75,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza1-10",
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
        "id": "texto-ramuza1-11",
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
        "id": "preco-ramuza1-12",
        "tipo": "preco",
        "x": 35.25,
        "y": 11.13,
        "largura": 12,
        "altura": 4.5,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "texto-ramuza1-13",
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
        "id": "texto-ramuza1-14",
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
        "id": "texto-ramuza1-15",
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
        "id": "tara-ramuza1-16",
        "tipo": "tara",
        "x": 40.75,
        "y": 18.88,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza1-17",
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
        "id": "dataEmbalagem-ramuza1-18",
        "tipo": "dataEmbalagem",
        "x": 5,
        "y": 19,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "peso-ramuza1-19",
        "tipo": "peso",
        "x": 40.88,
        "y": 21.75,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza1-22",
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
        "id": "texto-ramuza1-23",
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
        "id": "texto-ramuza1-25",
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
        "id": "pesoBrutoLiquido-ramuza1-30",
        "tipo": "pesoBrutoLiquido",
        "x": 37.88,
        "y": 21.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "validade-ramuza1-32",
        "tipo": "validade",
        "x": 4.88,
        "y": 22,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza1-34",
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
        "id": "texto-ramuza1-35",
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
        "id": "precoUnitario-ramuza1-36",
        "tipo": "precoUnitario",
        "x": 39.25,
        "y": 24.88,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "borda-ramuza1-39",
        "tipo": "borda",
        "x": 1.63,
        "y": 29.13,
        "largura": 55.13,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "ingredientes-ramuza1-40",
        "tipo": "ingredientes",
        "x": 0,
        "y": 31,
        "largura": 56,
        "altura": 15.38,
        "alinhamento": 2,
        "fonte": 13
      },
      {
        "id": "borda-ramuza1-42",
        "tipo": "borda",
        "x": 1.63,
        "y": 49,
        "largura": 56.63,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "selos-ramuza1-43",
        "tipo": "selos",
        "x": 1.63,
        "y": 51.63,
        "largura": 51,
        "altura": 8.38,
        "alinhamento": 2,
        "fonte": 5
      }
    ]
  },
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
    "id": "ramuza-2-40x60-invertido-padrão",
    "nome": "40x60 (INVERTIDO) Padrão ",
    "larguraMm": 40,
    "alturaMm": 60,
    "elementos": [
      {
        "id": "borda-ramuza2-1",
        "tipo": "borda",
        "x": 16.38,
        "y": 4.13,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "angulo": 270,
        "fonte": 1
      },
      {
        "id": "texto-ramuza2-3",
        "tipo": "texto",
        "x": 9.75,
        "y": 5.75,
        "largura": 2.88,
        "altura": 2.75,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza2-4",
        "tipo": "texto",
        "x": 6.88,
        "y": 5.75,
        "largura": 2.88,
        "altura": 2.75,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "borda-ramuza2-5",
        "tipo": "borda",
        "x": 16.38,
        "y": 8,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "angulo": 270,
        "fonte": 1
      },
      {
        "id": "texto-ramuza2-6",
        "tipo": "texto",
        "x": 16.88,
        "y": 14.25,
        "largura": 4,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "peso-ramuza2-7",
        "tipo": "peso",
        "x": 9.63,
        "y": 15,
        "largura": 9,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "tara-ramuza2-8",
        "tipo": "tara",
        "x": 6.75,
        "y": 15.13,
        "largura": 9.13,
        "altura": 2.75,
        "angulo": 270,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "precoUnitario-ramuza2-9",
        "tipo": "precoUnitario",
        "x": 12.63,
        "y": 16.75,
        "largura": 10.75,
        "altura": 2.75,
        "angulo": 270,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza2-10",
        "tipo": "texto",
        "x": 12.63,
        "y": 18.38,
        "largura": 4,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "pesoBrutoLiquido-ramuza2-11",
        "tipo": "pesoBrutoLiquido",
        "x": 9.75,
        "y": 18.38,
        "largura": 4,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza2-12",
        "tipo": "texto",
        "x": 6.88,
        "y": 18.63,
        "largura": 4,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "texto-ramuza2-13",
        "tipo": "texto",
        "x": 16.88,
        "y": 20,
        "largura": 6.25,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "preco-ramuza2-14",
        "tipo": "preco",
        "x": 20.63,
        "y": 21.13,
        "largura": 12,
        "altura": 4.5,
        "angulo": 270,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza2-15",
        "tipo": "borda",
        "x": 16.38,
        "y": 26.63,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "angulo": 270,
        "fonte": 1
      },
      {
        "id": "borda-ramuza2-16",
        "tipo": "borda",
        "x": 16.38,
        "y": 26.63,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "angulo": 270,
        "fonte": 1
      },
      {
        "id": "borda-ramuza2-17",
        "tipo": "borda",
        "x": 16.38,
        "y": 26.63,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "angulo": 270,
        "fonte": 1
      },
      {
        "id": "borda-ramuza2-18",
        "tipo": "borda",
        "x": 16.38,
        "y": 26.63,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "angulo": 270,
        "fonte": 1
      },
      {
        "id": "texto-ramuza2-20",
        "tipo": "texto",
        "x": 12.63,
        "y": 30.63,
        "largura": 13.63,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza2-23",
        "tipo": "texto",
        "x": 9.75,
        "y": 30.63,
        "largura": 13.63,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "texto-ramuza2-25",
        "tipo": "texto",
        "x": 6.88,
        "y": 30.75,
        "largura": 13.63,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "dataEmbalagem-ramuza2-28",
        "tipo": "dataEmbalagem",
        "x": 9.88,
        "y": 54,
        "largura": 17.75,
        "altura": 2.38,
        "angulo": 270,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "validade-ramuza2-30",
        "tipo": "validade",
        "x": 12.88,
        "y": 54.13,
        "largura": 17.88,
        "altura": 2.38,
        "angulo": 270,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "nome-ramuza2-32",
        "tipo": "nome",
        "x": 1.38,
        "y": 54.75,
        "largura": 49.75,
        "altura": 3.75,
        "angulo": 270,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza2-33",
        "tipo": "borda",
        "x": 6,
        "y": 57.13,
        "largura": 54.13,
        "altura": 0.5,
        "espessura": 2,
        "angulo": 270,
        "fonte": 2
      },
      {
        "id": "texto-ramuza2-34",
        "tipo": "texto",
        "x": 12.75,
        "y": 57.25,
        "largura": 8.63,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "texto-ramuza2-35",
        "tipo": "texto",
        "x": 9.75,
        "y": 57.25,
        "largura": 7.63,
        "altura": 2.63,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "ingredientes-ramuza2-36",
        "tipo": "ingredientes",
        "x": 28.25,
        "y": 58.25,
        "largura": 56,
        "altura": 11.75,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 13
      },
      {
        "id": "codigoBarras-ramuza2-37",
        "tipo": "codigoBarras",
        "x": 16.38,
        "y": 58.75,
        "largura": 24.25,
        "altura": 11,
        "angulo": 270,
        "alinhamento": 2,
        "fonte": 1
      }
    ]
  },
  {
    "id": "ramuza-27-glaceado-60x90",
    "nome": "Glaceado 60x90",
    "larguraMm": 56,
    "alturaMm": 90,
    "elementos": [
      {
        "id": "nome-ramuza27-0",
        "tipo": "nome",
        "x": 2.38,
        "y": 0,
        "largura": 49.75,
        "altura": 3.75,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza27-2",
        "tipo": "codigoBarras",
        "x": 0,
        "y": 4.63,
        "largura": 52.25,
        "altura": 7.88,
        "alinhamento": 1,
        "fonte": 1
      },
      {
        "id": "texto-ramuza27-5",
        "tipo": "texto",
        "x": 0.38,
        "y": 13.75,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza27-6",
        "tipo": "dataEmbalagem",
        "x": 8.5,
        "y": 13.75,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza27-7",
        "tipo": "texto",
        "x": 26.25,
        "y": 13.75,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza27-10",
        "tipo": "validade",
        "x": 34.38,
        "y": 13.75,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "texto-ramuza27-11",
        "tipo": "texto",
        "x": 0,
        "y": 16.63,
        "largura": 55.5,
        "altura": 3,
        "alinhamento": 1,
        "fonte": 1,
        "texto": "_________________________________________________________"
      },
      {
        "id": "peso-ramuza27-12",
        "tipo": "peso",
        "x": 15.5,
        "y": 19.13,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza27-13",
        "tipo": "texto",
        "x": 25.75,
        "y": 19.13,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza27-14",
        "tipo": "texto",
        "x": 3.38,
        "y": 19.25,
        "largura": 5,
        "altura": 2.5,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Peso"
      },
      {
        "id": "pesoBrutoLiquido-ramuza27-15",
        "tipo": "pesoBrutoLiquido",
        "x": 10,
        "y": 19.25,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza27-16",
        "tipo": "texto",
        "x": 30,
        "y": 19.25,
        "largura": 8.25,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Preço/kg"
      },
      {
        "id": "precoUnitario-ramuza27-17",
        "tipo": "precoUnitario",
        "x": 39,
        "y": 19.25,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza27-18",
        "tipo": "texto",
        "x": 40,
        "y": 19.25,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "texto-ramuza27-19",
        "tipo": "texto",
        "x": 0,
        "y": 22,
        "largura": 55.5,
        "altura": 3,
        "alinhamento": 1,
        "fonte": 1,
        "texto": "_________________________________________________________"
      },
      {
        "id": "texto-ramuza27-21",
        "tipo": "texto",
        "x": 6.13,
        "y": 25.38,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Glaceado:"
      },
      {
        "id": "texto-ramuza27-22",
        "tipo": "texto",
        "x": 17.25,
        "y": 25.38,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "="
      },
      {
        "id": "texto-ramuza27-33",
        "tipo": "texto",
        "x": 41.13,
        "y": 25.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza27-34",
        "tipo": "texto",
        "x": 0.13,
        "y": 29,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Embalagem:"
      },
      {
        "id": "texto-ramuza27-36",
        "tipo": "texto",
        "x": 25,
        "y": 29,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza27-37",
        "tipo": "texto",
        "x": 22.5,
        "y": 29.13,
        "largura": 14.75,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza27-38",
        "tipo": "texto",
        "x": 37.38,
        "y": 29.13,
        "largura": 4,
        "altura": 2.63,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza27-39",
        "tipo": "tara",
        "x": 41.25,
        "y": 29.13,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza27-41",
        "tipo": "texto",
        "x": 50,
        "y": 29.13,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "borda-ramuza27-42",
        "tipo": "borda",
        "x": 1.38,
        "y": 33,
        "largura": 52.75,
        "altura": 5,
        "espessura": 6,
        "fonte": 1
      },
      {
        "id": "texto-ramuza27-43",
        "tipo": "texto",
        "x": 12.38,
        "y": 34.25,
        "largura": 9.88,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total:"
      },
      {
        "id": "texto-ramuza27-44",
        "tipo": "texto",
        "x": 22.38,
        "y": 34.25,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza27-45",
        "tipo": "preco",
        "x": 26.5,
        "y": 34.25,
        "largura": 12,
        "altura": 2.63,
        "fonte": 5
      },
      {
        "id": "ingredientes-ramuza27-46",
        "tipo": "ingredientes",
        "x": 0,
        "y": 44.38,
        "largura": 56,
        "altura": 16.88,
        "alinhamento": 1,
        "fonte": 13
      }
    ]
  },
  {
    "id": "ramuza-3-60x120-padrão",
    "nome": "60x120 Padrão",
    "larguraMm": 56,
    "alturaMm": 120,
    "elementos": [
      {
        "id": "nome-ramuza3-1",
        "tipo": "nome",
        "x": 3.38,
        "y": 0.88,
        "largura": 49.75,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "borda-ramuza3-2",
        "tipo": "borda",
        "x": 3.5,
        "y": 5.5,
        "largura": 49.5,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "codigoBarras-ramuza3-3",
        "tipo": "codigoBarras",
        "x": 1.75,
        "y": 7.25,
        "largura": 24.25,
        "altura": 11,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza3-4",
        "tipo": "borda",
        "x": 29.38,
        "y": 7.25,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza3-5",
        "tipo": "borda",
        "x": 29.38,
        "y": 7.25,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza3-6",
        "tipo": "borda",
        "x": 29.38,
        "y": 7.25,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza3-7",
        "tipo": "borda",
        "x": 29.38,
        "y": 7.25,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza3-8",
        "tipo": "borda",
        "x": 48,
        "y": 7.25,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza3-9",
        "tipo": "borda",
        "x": 51.88,
        "y": 7.25,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza3-10",
        "tipo": "texto",
        "x": 36.38,
        "y": 7.5,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza3-11",
        "tipo": "texto",
        "x": 42.13,
        "y": 7.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza3-12",
        "tipo": "preco",
        "x": 35.25,
        "y": 11.63,
        "largura": 12,
        "altura": 4.5,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "texto-ramuza3-13",
        "tipo": "texto",
        "x": 2,
        "y": 19.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "texto-ramuza3-14",
        "tipo": "texto",
        "x": 25.5,
        "y": 19.38,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza3-15",
        "tipo": "texto",
        "x": 37.75,
        "y": 19.38,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza3-16",
        "tipo": "tara",
        "x": 40.75,
        "y": 19.38,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza3-17",
        "tipo": "texto",
        "x": 50.63,
        "y": 19.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "dataEmbalagem-ramuza3-18",
        "tipo": "dataEmbalagem",
        "x": 5,
        "y": 19.5,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "peso-ramuza3-19",
        "tipo": "peso",
        "x": 40.88,
        "y": 22.25,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza3-22",
        "tipo": "texto",
        "x": 50.63,
        "y": 22.25,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza3-23",
        "tipo": "texto",
        "x": 2,
        "y": 22.38,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "texto-ramuza3-25",
        "tipo": "texto",
        "x": 25.5,
        "y": 22.38,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza3-30",
        "tipo": "pesoBrutoLiquido",
        "x": 37.88,
        "y": 22.38,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "validade-ramuza3-32",
        "tipo": "validade",
        "x": 4.88,
        "y": 22.5,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza3-34",
        "tipo": "texto",
        "x": 25.5,
        "y": 25.38,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza3-35",
        "tipo": "texto",
        "x": 37.88,
        "y": 25.38,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza3-36",
        "tipo": "precoUnitario",
        "x": 39.25,
        "y": 25.38,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "ingredientes-ramuza3-37",
        "tipo": "ingredientes",
        "x": 0,
        "y": 29.88,
        "largura": 56,
        "altura": 19.88,
        "alinhamento": 2,
        "fonte": 13
      },
      {
        "id": "selos-ramuza3-39",
        "tipo": "selos",
        "x": 0.5,
        "y": 53.13,
        "largura": 49.75,
        "altura": 8.63,
        "alinhamento": 2,
        "fonte": 5
      },
      {
        "id": "tabelaNutricional-ramuza3-41",
        "tipo": "tabelaNutricional",
        "x": 0,
        "y": 64.75,
        "largura": 56,
        "altura": 38,
        "alinhamento": 2,
        "fonte": 8
      }
    ]
  },
  {
    "id": "ramuza-33-padrão-fabrica-60x40",
    "nome": "Padrão Fabrica 60X40 ",
    "larguraMm": 56,
    "alturaMm": 40,
    "elementos": [
      {
        "id": "nome-ramuza33-4",
        "tipo": "nome",
        "x": 0.38,
        "y": 1.75,
        "largura": 55.13,
        "altura": 3.75,
        "fonte": 8
      },
      {
        "id": "borda-ramuza33-5",
        "tipo": "borda",
        "x": 0.25,
        "y": 6.5,
        "largura": 55.25,
        "altura": 1,
        "espessura": 4,
        "fonte": 1
      },
      {
        "id": "texto-ramuza33-6",
        "tipo": "texto",
        "x": 50.63,
        "y": 9.5,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 7,
        "texto": "kg"
      },
      {
        "id": "tara-ramuza33-7",
        "tipo": "tara",
        "x": 41.5,
        "y": 10,
        "largura": 11.75,
        "altura": 2,
        "alinhamento": 2,
        "fonte": 7
      },
      {
        "id": "texto-ramuza33-8",
        "tipo": "texto",
        "x": 31.25,
        "y": 10.13,
        "largura": 4.75,
        "altura": 2.25,
        "alinhamento": 0,
        "fonte": 7,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza33-9",
        "tipo": "texto",
        "x": 37.75,
        "y": 10.13,
        "largura": 4,
        "altura": 2,
        "fonte": 7,
        "texto": "TP"
      },
      {
        "id": "codigoBarras-ramuza33-10",
        "tipo": "codigoBarras",
        "x": 0.25,
        "y": 10.75,
        "largura": 28,
        "altura": 13.63,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "texto-ramuza33-11",
        "tipo": "texto",
        "x": 50.75,
        "y": 13.25,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 7,
        "texto": "kg"
      },
      {
        "id": "pesoBrutoLiquido-ramuza33-13",
        "tipo": "pesoBrutoLiquido",
        "x": 37.88,
        "y": 13.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 7
      },
      {
        "id": "peso-ramuza33-14",
        "tipo": "peso",
        "x": 41.63,
        "y": 13.5,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 7
      },
      {
        "id": "texto-ramuza33-15",
        "tipo": "texto",
        "x": 31.5,
        "y": 13.63,
        "largura": 4.5,
        "altura": 2.5,
        "alinhamento": 0,
        "fonte": 7,
        "texto": "Peso"
      },
      {
        "id": "texto-ramuza33-17",
        "tipo": "texto",
        "x": 30.5,
        "y": 17.38,
        "largura": 9.63,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 7,
        "texto": "Preço/kg"
      },
      {
        "id": "precoUnitario-ramuza33-18",
        "tipo": "precoUnitario",
        "x": 41.88,
        "y": 17.38,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 7
      },
      {
        "id": "texto-ramuza33-19",
        "tipo": "texto",
        "x": 41.13,
        "y": 17.5,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 7,
        "texto": "R$"
      },
      {
        "id": "borda-ramuza33-21",
        "tipo": "borda",
        "x": 29.88,
        "y": 21.88,
        "largura": 24.38,
        "altura": 10.13,
        "espessura": 5,
        "fonte": 1
      },
      {
        "id": "borda-ramuza33-23",
        "tipo": "borda",
        "x": 30.13,
        "y": 22.13,
        "largura": 23.88,
        "altura": 3.75,
        "espessura": 20,
        "fonte": 1
      },
      {
        "id": "texto-ramuza33-24",
        "tipo": "texto",
        "x": 36.25,
        "y": 22.13,
        "largura": 9.88,
        "altura": 3.13,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "  Total R$ "
      },
      {
        "id": "texto-ramuza33-27",
        "tipo": "texto",
        "x": 0.75,
        "y": 25.13,
        "largura": 4.75,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 7,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza33-29",
        "tipo": "dataEmbalagem",
        "x": 8.25,
        "y": 25.13,
        "largura": 15.5,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 7
      },
      {
        "id": "preco-ramuza33-30",
        "tipo": "preco",
        "x": 31.5,
        "y": 25.75,
        "largura": 20.38,
        "altura": 4.5,
        "fonte": 11
      },
      {
        "id": "texto-ramuza33-33",
        "tipo": "texto",
        "x": 0.25,
        "y": 28.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 7,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza33-34",
        "tipo": "validade",
        "x": 8.25,
        "y": 28.38,
        "largura": 15.5,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 7
      },
      {
        "id": "texto-ramuza33-35",
        "tipo": "texto",
        "x": 2.13,
        "y": 33.63,
        "largura": 52.13,
        "altura": 3.5,
        "fonte": 7,
        "texto": "Volte Sempre!"
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
    "id": "ramuza-43-drenado-60x150",
    "nome": "Drenado 60x150",
    "larguraMm": 56,
    "alturaMm": 150,
    "elementos": [
      {
        "id": "imagem-ramuza43-1",
        "tipo": "imagem",
        "x": 13.88,
        "y": 0.25,
        "largura": 25,
        "altura": 6.25,
        "fonte": 1
      },
      {
        "id": "texto-ramuza43-4",
        "tipo": "texto",
        "x": 0,
        "y": 7.5,
        "largura": 55.5,
        "altura": 3,
        "alinhamento": 1,
        "fonte": 1,
        "texto": "_________________________________________________________"
      },
      {
        "id": "nome-ramuza43-5",
        "tipo": "nome",
        "x": 2.38,
        "y": 10,
        "largura": 49.75,
        "altura": 10.88,
        "alinhamento": 1,
        "fonte": 5
      },
      {
        "id": "codigoBarras-ramuza43-7",
        "tipo": "codigoBarras",
        "x": 1.13,
        "y": 14.38,
        "largura": 52.25,
        "altura": 7.88,
        "alinhamento": 1,
        "fonte": 1
      },
      {
        "id": "texto-ramuza43-10",
        "tipo": "texto",
        "x": 0.38,
        "y": 23.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza43-11",
        "tipo": "dataEmbalagem",
        "x": 8.38,
        "y": 23.38,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza43-12",
        "tipo": "texto",
        "x": 26.25,
        "y": 23.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza43-14",
        "tipo": "validade",
        "x": 34.63,
        "y": 23.38,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "peso-ramuza43-16",
        "tipo": "peso",
        "x": 15.5,
        "y": 28.75,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza43-17",
        "tipo": "texto",
        "x": 25.75,
        "y": 28.75,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza43-18",
        "tipo": "texto",
        "x": 3.38,
        "y": 28.88,
        "largura": 5,
        "altura": 2.5,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Peso"
      },
      {
        "id": "pesoBrutoLiquido-ramuza43-19",
        "tipo": "pesoBrutoLiquido",
        "x": 10,
        "y": 28.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza43-20",
        "tipo": "texto",
        "x": 30,
        "y": 28.88,
        "largura": 8.25,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Preço/kg"
      },
      {
        "id": "precoUnitario-ramuza43-21",
        "tipo": "precoUnitario",
        "x": 39,
        "y": 28.88,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza43-22",
        "tipo": "texto",
        "x": 40,
        "y": 28.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "texto-ramuza43-32",
        "tipo": "texto",
        "x": 0,
        "y": 31.63,
        "largura": 55.5,
        "altura": 3,
        "alinhamento": 1,
        "fonte": 1,
        "texto": "_________________________________________________________"
      },
      {
        "id": "texto-ramuza43-36",
        "tipo": "texto",
        "x": 6.13,
        "y": 35,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Drenado:"
      },
      {
        "id": "texto-ramuza43-37",
        "tipo": "texto",
        "x": 17.25,
        "y": 35,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "="
      },
      {
        "id": "texto-ramuza43-41",
        "tipo": "texto",
        "x": 41.13,
        "y": 35,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza43-42",
        "tipo": "texto",
        "x": 8.75,
        "y": 39,
        "largura": 14.75,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza43-43",
        "tipo": "texto",
        "x": 23.63,
        "y": 39,
        "largura": 4,
        "altura": 2.63,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza43-44",
        "tipo": "tara",
        "x": 27.5,
        "y": 39,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza43-45",
        "tipo": "texto",
        "x": 36.25,
        "y": 39,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "borda-ramuza43-47",
        "tipo": "borda",
        "x": 0.75,
        "y": 53.5,
        "largura": 52.75,
        "altura": 5,
        "espessura": 6,
        "fonte": 1
      },
      {
        "id": "texto-ramuza43-48",
        "tipo": "texto",
        "x": 11.25,
        "y": 54.38,
        "largura": 9.88,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total:"
      },
      {
        "id": "texto-ramuza43-49",
        "tipo": "texto",
        "x": 21.25,
        "y": 54.38,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza43-51",
        "tipo": "preco",
        "x": 25.38,
        "y": 54.38,
        "largura": 12,
        "altura": 2.63,
        "fonte": 5
      },
      {
        "id": "ingredientes-ramuza43-52",
        "tipo": "ingredientes",
        "x": 0.13,
        "y": 60.38,
        "largura": 56,
        "altura": 17.25,
        "alinhamento": 2,
        "fonte": 13
      },
      {
        "id": "tabelaNutricional-ramuza43-60",
        "tipo": "tabelaNutricional",
        "x": 0,
        "y": 88.63,
        "largura": 56,
        "altura": 45.13,
        "fonte": 8
      },
      {
        "id": "imagem-ramuza43-62",
        "tipo": "imagem",
        "x": 0,
        "y": 134.13,
        "largura": 53,
        "altura": 9.63,
        "alinhamento": 1,
        "fonte": 1
      }
    ]
  },
  {
    "id": "ramuza-44-drenado-60x120",
    "nome": "Drenado 60x120",
    "larguraMm": 56,
    "alturaMm": 120,
    "elementos": [
      {
        "id": "nome-ramuza44-1",
        "tipo": "nome",
        "x": 2.38,
        "y": 0.38,
        "largura": 49.75,
        "altura": 3.75,
        "fonte": 5
      },
      {
        "id": "codigoBarras-ramuza44-4",
        "tipo": "codigoBarras",
        "x": 1.13,
        "y": 4.75,
        "largura": 52.25,
        "altura": 7.88,
        "alinhamento": 1,
        "fonte": 1
      },
      {
        "id": "texto-ramuza44-6",
        "tipo": "texto",
        "x": 0.38,
        "y": 13.75,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza44-7",
        "tipo": "dataEmbalagem",
        "x": 8.38,
        "y": 13.75,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza44-9",
        "tipo": "texto",
        "x": 26.25,
        "y": 13.75,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza44-10",
        "tipo": "validade",
        "x": 35.63,
        "y": 13.75,
        "largura": 18.75,
        "altura": 2.38,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza44-12",
        "tipo": "texto",
        "x": 0,
        "y": 16.63,
        "largura": 55.5,
        "altura": 3,
        "alinhamento": 1,
        "fonte": 1,
        "texto": "_________________________________________________________"
      },
      {
        "id": "peso-ramuza44-13",
        "tipo": "peso",
        "x": 15.5,
        "y": 19.13,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza44-14",
        "tipo": "texto",
        "x": 25.75,
        "y": 19.13,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza44-15",
        "tipo": "texto",
        "x": 3.38,
        "y": 19.25,
        "largura": 5,
        "altura": 2.5,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Peso"
      },
      {
        "id": "pesoBrutoLiquido-ramuza44-16",
        "tipo": "pesoBrutoLiquido",
        "x": 10,
        "y": 19.25,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza44-17",
        "tipo": "texto",
        "x": 30,
        "y": 19.25,
        "largura": 8.25,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Preço/kg"
      },
      {
        "id": "precoUnitario-ramuza44-18",
        "tipo": "precoUnitario",
        "x": 39,
        "y": 19.25,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza44-19",
        "tipo": "texto",
        "x": 40,
        "y": 19.25,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "texto-ramuza44-20",
        "tipo": "texto",
        "x": 0,
        "y": 22,
        "largura": 55.5,
        "altura": 3,
        "alinhamento": 1,
        "fonte": 1,
        "texto": "_________________________________________________________"
      },
      {
        "id": "texto-ramuza44-22",
        "tipo": "texto",
        "x": 6.13,
        "y": 25.38,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Drenado:"
      },
      {
        "id": "texto-ramuza44-32",
        "tipo": "texto",
        "x": 17.25,
        "y": 25.38,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "="
      },
      {
        "id": "texto-ramuza44-37",
        "tipo": "texto",
        "x": 41.13,
        "y": 25.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza44-38",
        "tipo": "texto",
        "x": 8.75,
        "y": 29.38,
        "largura": 14.75,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza44-39",
        "tipo": "texto",
        "x": 23.63,
        "y": 29.38,
        "largura": 4,
        "altura": 2.63,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza44-41",
        "tipo": "tara",
        "x": 27.5,
        "y": 29.38,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza44-42",
        "tipo": "texto",
        "x": 36.25,
        "y": 29.38,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "borda-ramuza44-44",
        "tipo": "borda",
        "x": 1,
        "y": 48.63,
        "largura": 52.75,
        "altura": 5,
        "espessura": 6,
        "fonte": 1
      },
      {
        "id": "texto-ramuza44-45",
        "tipo": "texto",
        "x": 12.38,
        "y": 49.88,
        "largura": 9.88,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total:"
      },
      {
        "id": "texto-ramuza44-46",
        "tipo": "texto",
        "x": 22.38,
        "y": 49.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza44-47",
        "tipo": "preco",
        "x": 26.5,
        "y": 49.88,
        "largura": 12,
        "altura": 2.63,
        "fonte": 5
      },
      {
        "id": "ingredientes-ramuza44-51",
        "tipo": "ingredientes",
        "x": 1.25,
        "y": 55.5,
        "largura": 56,
        "altura": 17.25,
        "alinhamento": 2,
        "fonte": 13
      },
      {
        "id": "tabelaNutricional-ramuza44-57",
        "tipo": "tabelaNutricional",
        "x": 0.5,
        "y": 82.75,
        "largura": 56,
        "altura": 36.13,
        "fonte": 8
      }
    ]
  },
  {
    "id": "ramuza-45-glaceado-60x150",
    "nome": "Glaceado 60x150",
    "larguraMm": 56,
    "alturaMm": 104,
    "elementos": [
      {
        "id": "imagem-ramuza45-0",
        "tipo": "imagem",
        "x": 0,
        "y": 0,
        "largura": 56,
        "altura": 6.25,
        "alinhamento": 1,
        "fonte": 1
      },
      {
        "id": "nome-ramuza45-2",
        "tipo": "nome",
        "x": 2.38,
        "y": 6.63,
        "largura": 49.75,
        "altura": 3.75,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza45-5",
        "tipo": "codigoBarras",
        "x": 0,
        "y": 11.25,
        "largura": 52.25,
        "altura": 7.88,
        "alinhamento": 1,
        "fonte": 1
      },
      {
        "id": "texto-ramuza45-7",
        "tipo": "texto",
        "x": 0.38,
        "y": 20.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza45-9",
        "tipo": "dataEmbalagem",
        "x": 8.38,
        "y": 20.38,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza45-10",
        "tipo": "texto",
        "x": 26.25,
        "y": 20.38,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza45-11",
        "tipo": "validade",
        "x": 35.63,
        "y": 20.38,
        "largura": 18.75,
        "altura": 2.38,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza45-12",
        "tipo": "texto",
        "x": 0,
        "y": 23.25,
        "largura": 55.5,
        "altura": 3,
        "alinhamento": 1,
        "fonte": 1,
        "texto": "_________________________________________________________"
      },
      {
        "id": "peso-ramuza45-13",
        "tipo": "peso",
        "x": 15.5,
        "y": 25.75,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza45-14",
        "tipo": "texto",
        "x": 25.75,
        "y": 25.75,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza45-15",
        "tipo": "texto",
        "x": 3.38,
        "y": 25.88,
        "largura": 5,
        "altura": 2.5,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Peso"
      },
      {
        "id": "pesoBrutoLiquido-ramuza45-16",
        "tipo": "pesoBrutoLiquido",
        "x": 10,
        "y": 25.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza45-17",
        "tipo": "texto",
        "x": 30,
        "y": 25.88,
        "largura": 8.25,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Preço/kg"
      },
      {
        "id": "precoUnitario-ramuza45-18",
        "tipo": "precoUnitario",
        "x": 39,
        "y": 25.88,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza45-19",
        "tipo": "texto",
        "x": 40,
        "y": 25.88,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "texto-ramuza45-20",
        "tipo": "texto",
        "x": 0,
        "y": 28.63,
        "largura": 55.5,
        "altura": 3,
        "alinhamento": 1,
        "fonte": 1,
        "texto": "_________________________________________________________"
      },
      {
        "id": "texto-ramuza45-22",
        "tipo": "texto",
        "x": 6.13,
        "y": 32,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Glaceado:"
      },
      {
        "id": "texto-ramuza45-32",
        "tipo": "texto",
        "x": 17.25,
        "y": 32,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "="
      },
      {
        "id": "texto-ramuza45-34",
        "tipo": "texto",
        "x": 41.13,
        "y": 32,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza45-35",
        "tipo": "texto",
        "x": 0.13,
        "y": 35.63,
        "largura": 12.63,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Embalagem:"
      },
      {
        "id": "texto-ramuza45-37",
        "tipo": "texto",
        "x": 25,
        "y": 35.63,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza45-38",
        "tipo": "texto",
        "x": 22.5,
        "y": 35.75,
        "largura": 14.75,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza45-39",
        "tipo": "texto",
        "x": 37.38,
        "y": 35.75,
        "largura": 4,
        "altura": 2.63,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza45-41",
        "tipo": "tara",
        "x": 41.25,
        "y": 35.75,
        "largura": 12.75,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza45-42",
        "tipo": "texto",
        "x": 50,
        "y": 35.75,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "borda-ramuza45-43",
        "tipo": "borda",
        "x": 1,
        "y": 40.13,
        "largura": 52.75,
        "altura": 5,
        "espessura": 6,
        "fonte": 1
      },
      {
        "id": "texto-ramuza45-44",
        "tipo": "texto",
        "x": 12.38,
        "y": 41.38,
        "largura": 9.88,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total:"
      },
      {
        "id": "texto-ramuza45-45",
        "tipo": "texto",
        "x": 22.38,
        "y": 41.38,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza45-46",
        "tipo": "preco",
        "x": 26.5,
        "y": 41.38,
        "largura": 12,
        "altura": 2.63,
        "fonte": 5
      },
      {
        "id": "ingredientes-ramuza45-49",
        "tipo": "ingredientes",
        "x": 0,
        "y": 51.25,
        "largura": 56,
        "altura": 10.63,
        "alinhamento": 2,
        "fonte": 13
      },
      {
        "id": "selos-ramuza45-50",
        "tipo": "selos",
        "x": 0,
        "y": 53.63,
        "largura": 53.75,
        "altura": 12.25,
        "alinhamento": 1,
        "fonte": 5
      },
      {
        "id": "imagem-ramuza45-55",
        "tipo": "imagem",
        "x": 33.13,
        "y": 59.75,
        "largura": 19.63,
        "altura": 11,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "tabelaNutricional-ramuza45-60",
        "tipo": "tabelaNutricional",
        "x": 0,
        "y": 65,
        "largura": 56,
        "altura": 20.38,
        "fonte": 8
      },
      {
        "id": "imagem-ramuza45-63",
        "tipo": "imagem",
        "x": 0,
        "y": 85.5,
        "largura": 56,
        "altura": 17.38,
        "alinhamento": 1,
        "fonte": 1
      }
    ]
  },
  {
    "id": "ramuza-5-40x60-padrão",
    "nome": "40x60 Padrão",
    "larguraMm": 56,
    "alturaMm": 60,
    "elementos": [
      {
        "id": "nome-ramuza5-1",
        "tipo": "nome",
        "x": 4.5,
        "y": 0.5,
        "largura": 30.63,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 7
      },
      {
        "id": "borda-ramuza5-2",
        "tipo": "borda",
        "x": 0,
        "y": 5.13,
        "largura": 39,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "texto-ramuza5-3",
        "tipo": "texto",
        "x": 0,
        "y": 7,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza5-4",
        "tipo": "dataEmbalagem",
        "x": 6.13,
        "y": 7.13,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza5-5",
        "tipo": "codigoBarras",
        "x": 39,
        "y": 7.13,
        "largura": 20.13,
        "altura": 10.25,
        "angulo": 90,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "texto-ramuza5-6",
        "tipo": "texto",
        "x": 0,
        "y": 10,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza5-7",
        "tipo": "validade",
        "x": 6,
        "y": 10.13,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza5-8",
        "tipo": "texto",
        "x": 0,
        "y": 13,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza5-9",
        "tipo": "texto",
        "x": 11.75,
        "y": 13,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza5-10",
        "tipo": "tara",
        "x": 14.75,
        "y": 13,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza5-11",
        "tipo": "texto",
        "x": 24.63,
        "y": 13,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "peso-ramuza5-12",
        "tipo": "peso",
        "x": 14.88,
        "y": 15.88,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza5-14",
        "tipo": "texto",
        "x": 24.63,
        "y": 15.88,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza5-15",
        "tipo": "texto",
        "x": 0,
        "y": 16,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza5-17",
        "tipo": "pesoBrutoLiquido",
        "x": 11.88,
        "y": 16,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza5-18",
        "tipo": "texto",
        "x": 0,
        "y": 19,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza5-20",
        "tipo": "texto",
        "x": 11.88,
        "y": 19,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza5-22",
        "tipo": "precoUnitario",
        "x": 13.25,
        "y": 19,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "borda-ramuza5-23",
        "tipo": "borda",
        "x": 0,
        "y": 23.38,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza5-25",
        "tipo": "borda",
        "x": 0,
        "y": 23.38,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza5-28",
        "tipo": "borda",
        "x": 0,
        "y": 23.38,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza5-30",
        "tipo": "borda",
        "x": 0,
        "y": 23.38,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza5-32",
        "tipo": "borda",
        "x": 18.63,
        "y": 23.38,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza5-33",
        "tipo": "borda",
        "x": 22.5,
        "y": 23.38,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza5-34",
        "tipo": "texto",
        "x": 7,
        "y": 23.75,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza5-35",
        "tipo": "texto",
        "x": 12.75,
        "y": 23.75,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza5-36",
        "tipo": "preco",
        "x": 5.88,
        "y": 27.75,
        "largura": 12,
        "altura": 4.5,
        "alinhamento": 1,
        "fonte": 11
      },
      {
        "id": "ingredientes-ramuza5-40",
        "tipo": "ingredientes",
        "x": 0,
        "y": 36.25,
        "largura": 56,
        "altura": 23.75,
        "alinhamento": 2,
        "fonte": 13
      }
    ]
  },
  {
    "id": "ramuza-53-et-comanda-134ax48l-mm-16p",
    "nome": "ET-COMANDA: 134Ax48L(mm) 16P ",
    "larguraMm": 48,
    "alturaMm": 157,
    "elementos": [
      {
        "id": "imagem-ramuza53-0",
        "tipo": "imagem",
        "x": 2.5,
        "y": 2.5,
        "largura": 42.63,
        "altura": 24.5,
        "fonte": 1
      },
      {
        "id": "texto-ramuza53-8",
        "tipo": "texto",
        "x": 0,
        "y": 40.38,
        "largura": 12.38,
        "altura": 3.5,
        "fonte": 6,
        "texto": ""
      },
      {
        "id": "texto-ramuza53-9",
        "tipo": "texto",
        "x": 0,
        "y": 43.5,
        "largura": 48,
        "altura": 2,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-11",
        "tipo": "texto",
        "x": 17.63,
        "y": 46.25,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-12",
        "tipo": "texto",
        "x": 0,
        "y": 49.63,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-14",
        "tipo": "texto",
        "x": 17.75,
        "y": 51.38,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-15",
        "tipo": "texto",
        "x": 0,
        "y": 54.75,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-17",
        "tipo": "texto",
        "x": 17.75,
        "y": 56.5,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-18",
        "tipo": "texto",
        "x": 0,
        "y": 59.88,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-20",
        "tipo": "texto",
        "x": 17.75,
        "y": 61.63,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-21",
        "tipo": "texto",
        "x": 0,
        "y": 65,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-23",
        "tipo": "texto",
        "x": 17.75,
        "y": 66.75,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-24",
        "tipo": "texto",
        "x": 0,
        "y": 70.13,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-26",
        "tipo": "texto",
        "x": 17.75,
        "y": 71.88,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-27",
        "tipo": "texto",
        "x": 0,
        "y": 75.25,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-29",
        "tipo": "texto",
        "x": 17.75,
        "y": 77,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-30",
        "tipo": "texto",
        "x": 0,
        "y": 80.38,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-32",
        "tipo": "texto",
        "x": 17.75,
        "y": 82.13,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-33",
        "tipo": "texto",
        "x": 0,
        "y": 85.5,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-35",
        "tipo": "texto",
        "x": 17.88,
        "y": 87.25,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-36",
        "tipo": "texto",
        "x": 0,
        "y": 90.63,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-38",
        "tipo": "texto",
        "x": 17.75,
        "y": 92.38,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-39",
        "tipo": "texto",
        "x": 0,
        "y": 95.75,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-41",
        "tipo": "texto",
        "x": 17.75,
        "y": 97.5,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-42",
        "tipo": "texto",
        "x": 0,
        "y": 100.88,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-44",
        "tipo": "texto",
        "x": 17.75,
        "y": 102.63,
        "largura": 30,
        "altura": 3.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "|       |       |       |       |       |"
      },
      {
        "id": "texto-ramuza53-45",
        "tipo": "texto",
        "x": 0,
        "y": 106,
        "largura": 47.13,
        "altura": 1.63,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-66",
        "tipo": "texto",
        "x": 1.63,
        "y": 108.38,
        "largura": 13,
        "altura": 3.25,
        "alinhamento": 2,
        "fonte": 6,
        "texto": "Item"
      },
      {
        "id": "texto-ramuza53-79",
        "tipo": "texto",
        "x": 0.13,
        "y": 111.63,
        "largura": 9.5,
        "altura": 3.25,
        "alinhamento": 2,
        "fonte": 6,
        "texto": "Preço"
      },
      {
        "id": "texto-ramuza53-80",
        "tipo": "texto",
        "x": 11.88,
        "y": 111.63,
        "largura": 21.5,
        "altura": 3.25,
        "alinhamento": 1,
        "fonte": 6,
        "texto": "Peso/Qtd"
      },
      {
        "id": "texto-ramuza53-81",
        "tipo": "texto",
        "x": 35.25,
        "y": 111.63,
        "largura": 13,
        "altura": 3.25,
        "alinhamento": 1,
        "fonte": 6,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza53-82",
        "tipo": "texto",
        "x": 0,
        "y": 114.88,
        "largura": 48,
        "altura": 1.88,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "nome-ramuza53-84",
        "tipo": "nome",
        "x": 0,
        "y": 116.75,
        "largura": 22.5,
        "altura": 3.25,
        "alinhamento": 2,
        "fonte": 6
      },
      {
        "id": "precoUnitario-ramuza53-85",
        "tipo": "precoUnitario",
        "x": 0,
        "y": 120,
        "largura": 12,
        "altura": 3.25,
        "alinhamento": 1,
        "fonte": 6
      },
      {
        "id": "peso-ramuza53-86",
        "tipo": "peso",
        "x": 20.5,
        "y": 120,
        "largura": 12,
        "altura": 3.25,
        "alinhamento": 2,
        "fonte": 6
      },
      {
        "id": "divisoria-ramuza53-88",
        "tipo": "divisoria",
        "x": 2.5,
        "y": 123.25,
        "largura": 25,
        "altura": 6.25
      },
      {
        "id": "divisoria-ramuza53-89",
        "tipo": "divisoria",
        "x": 2.63,
        "y": 126.63,
        "largura": 25,
        "altura": 6.25
      },
      {
        "id": "divisoria-ramuza53-90",
        "tipo": "divisoria",
        "x": 6.25,
        "y": 128.38,
        "largura": 25,
        "altura": 6.25
      },
      {
        "id": "texto-ramuza53-91",
        "tipo": "texto",
        "x": 0,
        "y": 130,
        "largura": 48,
        "altura": 2.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-94",
        "tipo": "texto",
        "x": 0,
        "y": 134.88,
        "largura": 24.5,
        "altura": 3.25,
        "alinhamento": 2,
        "fonte": 6,
        "texto": ""
      },
      {
        "id": "texto-ramuza53-95",
        "tipo": "texto",
        "x": 0,
        "y": 138.88,
        "largura": 48,
        "altura": 2.25,
        "alinhamento": 0,
        "fonte": 5,
        "texto": "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
      },
      {
        "id": "texto-ramuza53-96",
        "tipo": "texto",
        "x": 0,
        "y": 141.63,
        "largura": 15.13,
        "altura": 4.25,
        "alinhamento": 0,
        "fonte": 6,
        "texto": "Total:"
      },
      {
        "id": "codigoBarras-ramuza53-99",
        "tipo": "codigoBarras",
        "x": 9.88,
        "y": 147.13,
        "largura": 27.38,
        "altura": 9.88,
        "alinhamento": 1
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
    "id": "ramuza-8-40x40-padrão",
    "nome": "40x40 Padrão",
    "larguraMm": 39,
    "alturaMm": 40,
    "elementos": [
      {
        "id": "nome-ramuza8-1",
        "tipo": "nome",
        "x": 4.5,
        "y": 0.5,
        "largura": 30.63,
        "altura": 3.75,
        "alinhamento": 1,
        "fonte": 7
      },
      {
        "id": "borda-ramuza8-2",
        "tipo": "borda",
        "x": 0,
        "y": 5.13,
        "largura": 39,
        "altura": 0.5,
        "espessura": 2,
        "fonte": 2
      },
      {
        "id": "texto-ramuza8-3",
        "tipo": "texto",
        "x": 1,
        "y": 7,
        "largura": 7.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Data:"
      },
      {
        "id": "dataEmbalagem-ramuza8-4",
        "tipo": "dataEmbalagem",
        "x": 9.13,
        "y": 7.13,
        "largura": 17.75,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "codigoBarras-ramuza8-5",
        "tipo": "codigoBarras",
        "x": 39,
        "y": 9.25,
        "largura": 20.13,
        "altura": 9.75,
        "angulo": 90,
        "alinhamento": 2,
        "fonte": 1
      },
      {
        "id": "texto-ramuza8-6",
        "tipo": "texto",
        "x": 1,
        "y": 10,
        "largura": 8.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Validade:"
      },
      {
        "id": "validade-ramuza8-7",
        "tipo": "validade",
        "x": 9,
        "y": 10.13,
        "largura": 17.88,
        "altura": 2.38,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza8-8",
        "tipo": "texto",
        "x": 1,
        "y": 13,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Tara:"
      },
      {
        "id": "texto-ramuza8-9",
        "tipo": "texto",
        "x": 12.75,
        "y": 13,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "TP"
      },
      {
        "id": "tara-ramuza8-10",
        "tipo": "tara",
        "x": 15,
        "y": 13,
        "largura": 9.13,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza8-11",
        "tipo": "texto",
        "x": 23.88,
        "y": 13,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "peso-ramuza8-12",
        "tipo": "peso",
        "x": 15.13,
        "y": 15.88,
        "largura": 9,
        "altura": 2.63,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "texto-ramuza8-14",
        "tipo": "texto",
        "x": 23.88,
        "y": 15.88,
        "largura": 2.88,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4,
        "texto": "kg"
      },
      {
        "id": "texto-ramuza8-15",
        "tipo": "texto",
        "x": 1,
        "y": 16,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Peso:"
      },
      {
        "id": "pesoBrutoLiquido-ramuza8-17",
        "tipo": "pesoBrutoLiquido",
        "x": 12.88,
        "y": 16,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4
      },
      {
        "id": "texto-ramuza8-18",
        "tipo": "texto",
        "x": 1,
        "y": 19,
        "largura": 13.63,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 5,
        "texto": "Preço/kg:"
      },
      {
        "id": "texto-ramuza8-20",
        "tipo": "texto",
        "x": 12.75,
        "y": 19,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 2,
        "fonte": 4,
        "texto": "R$"
      },
      {
        "id": "precoUnitario-ramuza8-22",
        "tipo": "precoUnitario",
        "x": 16,
        "y": 19,
        "largura": 10.75,
        "altura": 2.75,
        "alinhamento": 0,
        "fonte": 4
      },
      {
        "id": "borda-ramuza8-23",
        "tipo": "borda",
        "x": 2.13,
        "y": 26.38,
        "largura": 23.63,
        "altura": 9.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza8-25",
        "tipo": "borda",
        "x": 2.13,
        "y": 26.38,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza8-28",
        "tipo": "borda",
        "x": 2.13,
        "y": 26.38,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza8-30",
        "tipo": "borda",
        "x": 2.13,
        "y": 26.38,
        "largura": 23.63,
        "altura": 3.75,
        "espessura": 2,
        "fonte": 1
      },
      {
        "id": "borda-ramuza8-32",
        "tipo": "borda",
        "x": 20.75,
        "y": 26.38,
        "largura": 5,
        "altura": 3.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "borda-ramuza8-33",
        "tipo": "borda",
        "x": 24.63,
        "y": 26.38,
        "largura": 1.13,
        "altura": 9.75,
        "espessura": 15,
        "fonte": 1
      },
      {
        "id": "texto-ramuza8-34",
        "tipo": "texto",
        "x": 9.13,
        "y": 26.75,
        "largura": 6.25,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "Total"
      },
      {
        "id": "texto-ramuza8-35",
        "tipo": "texto",
        "x": 14.88,
        "y": 26.75,
        "largura": 4,
        "altura": 2.63,
        "alinhamento": 1,
        "fonte": 5,
        "texto": "R$"
      },
      {
        "id": "preco-ramuza8-36",
        "tipo": "preco",
        "x": 8,
        "y": 30.75,
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
  },
  {
    "id": "pesohub-60x80-padrao-com-tabela",
    "nome": "60x80 Padrão + tabela nutricional",
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
      },
      {
        "id": "tabelaNutricional-pesohub-60x80-1",
        "tipo": "tabelaNutricional",
        "x": 0,
        "y": 62,
        "largura": 56,
        "altura": 16.5,
        "alinhamento": 2,
        "fonte": 8
      }
    ]
  }
];
