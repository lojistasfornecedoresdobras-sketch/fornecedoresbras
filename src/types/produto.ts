export type UnidadeMedida = 'DZ' | 'PC' | 'CX';

export interface FotoProduto {
  id: string;
  url: string;
  ordem: number;
}

export interface Produto {
  id: string;
  nome: string;
  preco_atacado: number;
  preco_minimo_pequeno: number;
  quantidade_estoque: number;
  unidade_medida: UnidadeMedida;
  categoria: string;
  desconto_atacado: number;
  fornecedor_id: string;
  minimo_compra: number;
  created_at: string;
  peso_kg: number;
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
  
  // Novo campo de relacionamento
  fotos_produto: FotoProduto[];
}