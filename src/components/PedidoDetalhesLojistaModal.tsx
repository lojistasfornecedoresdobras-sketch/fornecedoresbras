import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Package, Truck, CheckCircle, XCircle, CreditCard, MapPin } from 'lucide-react';
import { PedidoDetalhes, PedidoStatus } from '@/types/pedido';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { useProductNames } from '@/hooks/use-product-names';

interface PedidoDetalhesLojistaModalProps {
  pedidoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const PedidoDetalhesLojistaModal: React.FC<PedidoDetalhesLojistaModalProps> = ({ pedidoId, isOpen, onClose }) => {
  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fornecedorNome, setFornecedorNome] = useState<string>('Carregando...');

  useEffect(() => {
    if (isOpen && pedidoId) {
      fetchPedidoDetalhes(pedidoId);
    } else {
      setPedido(null);
      setFornecedorNome('Carregando...');
    }
  }, [isOpen, pedidoId]);

  const fetchFornecedorName = async (fornecedorId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('nome_fantasia')
      .eq('id', fornecedorId)
      .single();
    
    if (error) {
      console.error("Erro ao buscar nome do fornecedor:", error);
      return `Fornecedor ID: ${fornecedorId.substring(0, 8)}`;
    }
    return data.nome_fantasia || `Fornecedor ID: ${fornecedorId.substring(0, 8)}`;
  };

  const fetchPedidoDetalhes = async (id: string) => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        itens_pedido (
          id,
          produto_id,
          quantidade_dz_pc_cx,
          preco_unitario_atacado,
          subtotal_atacado
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      showError("Erro ao carregar detalhes do pedido: " + error.message);
      console.error(error);
      setPedido(null);
    } else {
      setPedido(data as PedidoDetalhes);
      // Busca o nome do fornecedor
      const nome = await fetchFornecedorName(data.fornecedor_id);
      setFornecedorNome(nome);
    }
    setIsLoading(false);
  };

  // Extrai IDs dos produtos para buscar os nomes
  const productIds = pedido?.itens_pedido.map(item => item.produto_id) || [];
  const { productNames, isLoading: isProductNamesLoading } = useProductNames(productIds);

  const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
  };

  const getStatusDisplay = (status: PedidoStatus) => {
    let color = 'text-gray-600';
    let icon = <Loader2 className="w-4 h-4 mr-2 animate-spin" />;

    switch (status) {
      case 'Aguardando Pagamento':
        color = 'text-yellow-600';
        icon = <CreditCard className="w-4 h-4 mr-2" />;
        break;
      case 'Em Processamento':
        color = 'text-blue-600';
        icon = <Package className="w-4 h-4 mr-2" />;
        break;
      case 'Enviado':
        color = 'text-atacado-accent';
        icon = <Truck className="w-4 h-4 mr-2" />;
        break;
      case 'Concluído':
        color = 'text-green-600';
        icon = <CheckCircle className="w-4 h-4 mr-2" />;
        break;
      case 'Cancelado':
        color = 'text-red-600';
        icon = <XCircle className="w-4 h-4 mr-2" />;
        break;
    }

    return (
      <span className={`flex items-center font-semibold ${color}`}>
        {icon} {status}
      </span>
    );
  };

  const isContentLoading = isLoading || isProductNamesLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-atacado-primary">Detalhes do Meu Pedido</DialogTitle>
          <DialogDescription>
            Acompanhe o status e os itens do seu pedido de atacado.
          </DialogDescription>
        </DialogHeader>

        {isContentLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
          </div>
        ) : !pedido ? (
          <p className="text-center text-gray-500">Pedido não encontrado.</p>
        ) : (
          <div className="space-y-4">
            
            {/* Informações Gerais */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 text-sm space-y-1">
                <p><strong>Pedido ID:</strong> {pedido.id.substring(0, 8)}</p>
                <p><strong>Data:</strong> {new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
                <p><strong>Fornecedor:</strong> {fornecedorNome}</p>
                <div className="flex items-center">
                  <strong>Status Atual:</strong> 
                  <span className="ml-2">
                    {getStatusDisplay(pedido.status)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Rastreamento (Mock) */}
            <Card className="border-atacado-accent/50">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-atacado-accent flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> Rastreamento & Entrega
                </h3>
                {pedido.status === 'Enviado' ? (
                  <p className="text-sm text-gray-700">
                    Seu pedido foi enviado! Código de Rastreio: <span className="font-mono bg-gray-100 p-1 rounded">BR123456789BR</span>
                  </p>
                ) : pedido.status === 'Concluído' ? (
                  <p className="text-sm text-green-600">Entrega concluída com sucesso!</p>
                ) : (
                  <p className="text-sm text-gray-500">Rastreamento disponível após o envio.</p>
                )}
              </CardContent>
            </Card>

            {/* Itens do Pedido */}
            <h3 className="font-semibold text-atacado-primary flex items-center">
              <Package className="w-4 h-4 mr-2" /> Itens ({pedido.itens_pedido.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {pedido.itens_pedido.map((item, index) => (
                <div key={index} className="flex justify-between text-sm border-b pb-1">
                  <p className="text-gray-700">
                    {item.quantidade_dz_pc_cx}x {productNames[item.produto_id] || `Produto ID: ${item.produto_id.substring(0, 8)}`}
                  </p>
                  <p className="font-medium text-right">
                    {formatCurrency(item.subtotal_atacado)}
                  </p>
                </div>
              ))}
            </div>
            
            <Separator />

            {/* Resumo Financeiro */}
            <div className="flex justify-between text-lg font-bold text-atacado-accent">
              <span>Total Pago</span>
              <span>{formatCurrency(pedido.total_atacado)}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PedidoDetalhesLojistaModal;