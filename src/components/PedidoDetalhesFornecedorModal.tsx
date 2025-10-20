import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Package, Truck, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { PedidoDetalhes, PedidoStatus } from '@/types/pedido';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useProductNames } from '@/hooks/use-product-names';
import { useB2BUserNames } from '@/hooks/use-b2b-user-names'; // Importando o novo hook

interface PedidoDetalhesFornecedorModalProps {
  pedidoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Callback para atualizar a lista de pedidos na página pai
}

const statusOptions: PedidoStatus[] = [
  'Aguardando Pagamento',
  'Em Processamento',
  'Enviado',
  'Concluído',
  'Cancelado',
];

const PedidoDetalhesFornecedorModal: React.FC<PedidoDetalhesFornecedorModalProps> = ({ pedidoId, isOpen, onClose, onUpdate }) => {
  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<PedidoStatus | string>('');

  useEffect(() => {
    if (isOpen && pedidoId) {
      fetchPedidoDetalhes(pedidoId);
    } else {
      setPedido(null);
      setNewStatus('');
    }
  }, [isOpen, pedidoId]);

  const fetchPedidoDetalhes = async (id: string) => {
    setIsLoading(true);
    // Busca o pedido e os itens relacionados (join)
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
      setNewStatus(data.status);
    }
    setIsLoading(false);
  };

  // Hooks para buscar nomes
  const productIds = pedido?.itens_pedido.map(item => item.produto_id) || [];
  const { productNames, isLoading: isProductNamesLoading } = useProductNames(productIds);
  
  const lojistaId = pedido?.lojista_id ? [pedido.lojista_id] : [];
  const { userNames: lojistaNames, isLoading: isLojistaNameLoading } = useB2BUserNames(lojistaId);
  const lojistaNome = lojistaNames[lojistaId[0]] || (lojistaId[0] ? `Lojista ID: ${lojistaId[0].substring(0, 8)}` : 'N/A');


  const handleUpdateStatus = async () => {
    if (!pedido || newStatus === pedido.status) return;

    setIsUpdating(true);
    
    const { error } = await supabase
      .from('pedidos')
      .update({ status: newStatus })
      .eq('id', pedido.id);

    if (error) {
      showError("Erro ao atualizar status: " + error.message);
      console.error(error);
    } else {
      showSuccess(`Status do pedido #${pedido.id.substring(0, 8)} atualizado para: ${newStatus}`);
      onUpdate(); // Atualiza a lista na página pai
      setPedido(prev => prev ? { ...prev, status: newStatus as PedidoStatus } : null);
    }
    setIsUpdating(false);
  };

  const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
  };

  const getStatusIcon = (status: PedidoStatus) => {
    switch (status) {
      case 'Aguardando Pagamento': return <Loader2 className="w-4 h-4 mr-2 animate-spin text-yellow-600" />;
      case 'Em Processamento': return <Package className="w-4 h-4 mr-2 text-blue-600" />;
      case 'Enviado': return <Truck className="w-4 h-4 mr-2 text-atacado-accent" />;
      case 'Concluído': return <CheckCircle className="w-4 h-4 mr-2 text-green-600" />;
      case 'Cancelado': return <XCircle className="w-4 h-4 mr-2 text-red-600" />;
      default: return null;
    }
  };

  const isContentLoading = isLoading || isProductNamesLoading || isLojistaNameLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-atacado-primary">Detalhes do Pedido</DialogTitle>
          <DialogDescription>
            Visualize os itens e gerencie o status do pedido.
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
                <p><strong>Lojista:</strong> <span className="font-semibold">{lojistaNome}</span></p>
                <div className="flex items-center">
                  <strong>Status Atual:</strong> 
                  <span className="ml-2 flex items-center font-semibold text-atacado-primary">
                    {getStatusIcon(pedido.status)} {pedido.status}
                  </span>
                </div>
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
              <span>Total do Pedido</span>
              <span>{formatCurrency(pedido.total_atacado)}</span>
            </div>

            <Separator />

            {/* Atualização de Status */}
            <div className="space-y-2 pt-2">
              <h3 className="font-semibold text-atacado-primary">Atualizar Status</h3>
              <div className="flex space-x-2">
                <Select 
                  value={newStatus} 
                  onValueChange={setNewStatus}
                  disabled={isUpdating || pedido.status === 'Concluído' || pedido.status === 'Cancelado'}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || newStatus === pedido.status || pedido.status === 'Concluído' || pedido.status === 'Cancelado'}
                  className="bg-atacado-accent hover:bg-orange-600"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
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

export default PedidoDetalhesFornecedorModal;