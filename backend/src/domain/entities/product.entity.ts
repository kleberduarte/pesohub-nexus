export class Product {
  id!: string;
  codigo!: string;
  codigoBarras!: string;
  nome!: string;
  preco!: number;
  categoriaImposto?: string | null;
  ativo!: boolean;
  versao!: number;
}
