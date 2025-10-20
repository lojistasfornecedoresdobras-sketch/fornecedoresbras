export type PedidoStatus = 'Aguardando Pagamento' | 'Em Processamento' | 'Enviado' | 'Concluído' | 'Cancelado';

export interface ItemPedido {
  id: string;
  produto_id: string;
  quantidade_dz_pc_cx: number;
  preco_unitario_atacado: number;
  subtotal_atacado: number;
  // Em um cenário real, buscaríamos o nome do produto aqui
}

export interface PedidoDetalhes {
  id: string;
  created_at: string;
  total_atacado: number;
  status: PedidoStatus;
  lojista_id: string;
  fornecedor_id: string;
  itens_pedido: ItemPedido[];
  // Adicionar lojista_nome/email em um cenário real
}