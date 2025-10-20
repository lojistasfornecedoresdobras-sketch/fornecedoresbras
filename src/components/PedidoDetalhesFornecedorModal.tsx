import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Package, Truck, CheckCircle, XCircle, ArrowRight, MapPin } from 'lucide-react';
import { PedidoDetalhes, PedidoStatus } from '@/types/pedido';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useProductNames } from '@/hooks/use-product-names';
import { useB2BUserNames } from '@/hooks/use-b2b-user-names';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

// Tipagem para Frete (simplificada para o mock)
interface Frete {
  codigo_rastreio: string | null;
  transportadora: string | null;
  status: string | null;
}

const PedidoDetalhesFornecedorModal: React.FC<PedidoDetalhesFornecedorModalProps> = ({ pedidoId, isOpen, onClose, onUpdate }) => {
  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null);
  const [frete, setFrete] = useState<Frete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingFrete, setIsSavingFrete] = useState(false);
  const [newStatus, setNewStatus] = useState<PedidoStatus | string>('');
  const [rastreioInput, setRastreioInput] = useState('');
  const [transportadoraInput, setTransportadoraInput] = useState('');

  useEffect(() => {
    if (isOpen && pedidoId) {
      fetchPedidoDetalhes(pedidoId);
    } else {
      setPedido(null);
      setFrete(null);
      setNewStatus('');
      setRastreioInput('');
      setTransportadoraInput('');
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
      setRastreioInput(data.codigo_rastreio || '');
      setTransportadoraInput(data.transportadora || '');
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

    if (error || !data) {
      showError("Erro ao carregar detalhes do pedido: " + (error?.message || "Pedido não encontrado."));
      console.error(error);
      setPedido(null);
    } else {
      setPedido(data as PedidoDetalhes);
      setNewStatus(data.status);
      await fetchFrete(id);
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

  const handleSaveFrete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoId || !rastreioInput || !transportadoraInput) {
      showError("Preencha o código de rastreio e a transportadora.");
      return;
    }

    setIsSavingFrete(true);

    const freteData = {
      pedido_id: pedidoId,
      codigo_rastreio: rastreioInput,
      transportadora: transportadoraInput,
      custo: 0, // Mock
      status: 'Aguardando Envio', // Mock
    };

    // Tenta inserir ou atualizar (upsert)
    const { error } = await supabase
      .from('fretes')
      .upsert(freteData, { onConflict: 'pedido_id' });

    if (error) {
      showError("Erro ao salvar frete: " + error.message);
      console.error(error);
    } else {
      showSuccess("Dados de frete salvos com sucesso!");
      // Atualiza o status do pedido para 'Em Processamento' se ainda estiver 'Aguardando Pagamento'
      if (pedido?.status === 'Aguardando Pagamento') {
        setNewStatus('Em Processamento');
        handleUpdateStatus(); // Chama a atualização de status
      }
      fetchFrete(pedidoId); // Recarrega os dados de frete
    }
    setIsSavingFrete(false);
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

            {/* Gerenciamento de Envio/Frete */}
            <Card className="border-atacado-accent/50">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-atacado-accent flex items-center">
                  <Truck className="w-4 h-4 mr-2" /> Gerenciamento de Envio
                </h3>
                
                {frete?.codigo_rastreio ? (
                  <div className="space-y-1 text-sm">
                    <p><strong>Transportadora:</strong> {frete.transportadora}</p>
                    <p><strong>Rastreio:</strong> <span className="font-mono bg-gray-100 p-1 rounded">{frete.codigo_rastreio}</span></p>
                    <p className="text-green-600">Frete registrado. Status: {frete.status || 'Aguardando Envio'}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveFrete} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="transportadora">Transportadora</Label>
                      <Input 
                        id="transportadora" 
                        placeholder="Ex: Correios, Jadlog" 
                        value={transportadoraInput} 
                        onChange={(e) => setTransportadoraInput(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rastreio">Código de Rastreio</Label>
                      <Input 
                        id="rastreio" 
                        placeholder="Ex: BR123456789BR" 
                        value={rastreioInput} 
                        onChange={(e) => setRastreioInput(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="w-full bg-atacado-accent hover:bg-orange-600"
                      disabled={isSavingFrete}
                    >
                      {isSavingFrete ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar Frete'}
                    </Button>
                  </form>
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