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
import { useB2BUserNames } from '@/hooks/use-b2b-user-names'; // Importando o novo hook

interface PedidoDetalhesLojistaModalProps {
  pedidoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Tipagem para Frete (simplificada para o mock)
interface Frete {
  codigo_rastreio: string | null;
  transportadora: string | null;
  status: string | null;
}

const PedidoDetalhesLojistaModal: React.FC<PedidoDetalhesLojistaModalProps> = ({ pedidoId, isOpen, onClose }) => {
  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null);
  const [frete, setFrete] = useState<Frete | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && pedidoId) {
      fetchPedidoDetalhes(pedidoId);
    } else {
      setPedido(null);
      setFrete(null);
    }
  }, [isOpen, pedidoId]);

  const fetchFrete = async (pedidoId: string) => {
    const { data, error } = await supabase
      .from('fretes')
      .select('codigo_rastreio, transportadora, status')
      .eq('pedido_id', pedidoId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error("Erro ao buscar frete:", error);
    }
    
    if (data) {
      setFrete(data as Frete);
    } else {
      setFrete(null);
    }
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
      await fetchFrete(id);
    }
    setIsLoading(false);
  };

  // Hooks para buscar nomes
  const productIds = pedido?.itens_pedido.map(item => item.produto_id) || [];
  const { productNames, isLoading: isProductNamesLoading } = useProductNames(productIds);
  
  const fornecedorId = pedido?.fornecedor_id ? [pedido.fornecedor_id] : [];
  const { userNames: fornecedorNames, isLoading: isFornecedorNameLoading } = useB2BUserNames(fornecedorId);
  const fornecedorNome = fornecedorNames[fornecedorId[0]] || (fornecedorId[0] ? `Fornecedor ID: ${fornecedorId[0].substring(0, 8)}` : 'N/A');


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

  const isContentLoading = isLoading || isProductNamesLoading || isFornecedorNameLoading;

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
                <p><strong>Fornecedor:</strong> <span className="font-semibold">{fornecedorNome}</span></p>
                <div className="flex items-center">
                  <strong>Status Atual:</strong> 
                  <span className="ml-2">
                    {getStatusDisplay(pedido.status)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Rastreamento */}
            <Card className="border-atacado-accent/50">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-atacado-accent flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> Rastreamento & Entrega
                </h3>
                {frete?.codigo_rastreio ? (
                  <div className="space-y-1 text-sm">
                    <p><strong>Transportadora:</strong> {frete.transportadora}</p>
                    <p><strong>Rastreio:</strong> <span className="font-mono bg-gray-100 p-1 rounded">{frete.codigo_rastreio}</span></p>
                    <p className="text-green-600">Status do Frete: {frete.status || 'Em Trânsito'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {pedido.status === 'Aguardando Pagamento' ? 'Aguardando confirmação de pagamento.' : 'Aguardando registro de envio pelo fornecedor.'}
                  </p>
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