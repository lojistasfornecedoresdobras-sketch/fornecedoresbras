import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Truck, Loader2, ArrowRight, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { PedidoStatus } from '@/types/pedido';
import { useB2BUserNames } from '@/hooks/use-b2b-user-names';
import PedidoDetalhesFornecedorModal from '@/components/PedidoDetalhesFornecedorModal'; // Reutilizando o modal de detalhes
import { Button } from '@/components/ui/button'; // Adicionado

interface Pedido {
  id: string;
  created_at: string;
  total_atacado: number;
  status: PedidoStatus;
  lojista_id: string;
  fornecedor_id: string;
}

const GerenciarPedidosAdmin: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);

  // 1. Coletar IDs de lojistas e fornecedores
  const allUserIds = useMemo(() => {
    const lojistas = pedidos.map(p => p.lojista_id);
    const fornecedores = pedidos.map(p => p.fornecedor_id);
    return Array.from(new Set([...lojistas, ...fornecedores]));
  }, [pedidos]);

  const { userNames: userNamesMap, isLoading: isNamesLoading } = useB2BUserNames(allUserIds);

  const fetchPedidos = useCallback(async () => {
    setIsLoading(true);
    
    // Busca todos os pedidos (Admin deve ter RLS para ler todos)
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, created_at, total_atacado, status, lojista_id, fornecedor_id')
      .order('created_at', { ascending: false });

    if (error) {
      showError("Erro ao carregar pedidos: " + error.message);
      console.error(error);
    } else {
      setPedidos(data as Pedido[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const handleOpenModal = (pedidoId: string) => {
    setSelectedPedidoId(pedidoId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPedidoId(null);
    fetchPedidos(); // Recarrega a lista após fechar o modal (caso o status tenha sido alterado)
  };

  const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
  };

  const getStatusBadge = (status: PedidoStatus) => {
    let classes = "px-2 py-1 rounded-full text-xs font-medium";
    let icon = null;

    switch (status) {
      case 'Aguardando Pagamento':
        classes += " bg-yellow-100 text-yellow-800";
        icon = <Loader2 className="w-3 h-3 mr-1 animate-spin" />;
        break;
      case 'Em Processamento':
        classes += " bg-blue-100 text-blue-800";
        icon = <Package className="w-3 h-3 mr-1" />;
        break;
      case 'Enviado':
        classes += " bg-atacado-accent text-white";
        icon = <Truck className="w-3 h-3 mr-1" />;
        break;
      case 'Concluído':
        classes += " bg-green-100 text-green-800";
        icon = <CheckCircle className="w-3 h-3 mr-1" />;
        break;
      case 'Cancelado':
        classes += " bg-red-100 text-red-800";
        icon = <XCircle className="w-3 h-3 mr-1" />;
        break;
      default:
        classes += " bg-gray-100 text-gray-800";
    }

    return (
      <span className={`flex items-center justify-center ${classes}`}>
        {icon} {status}
      </span>
    );
  };

  const displayLoading = isLoading || isNamesLoading;

  return (
    <div className="flex min-h-screen bg-atacado-background">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b bg-white">
          <h1 className="text-2xl font-bold text-atacado-primary flex items-center">
            <ShoppingCart className="w-6 h-6 mr-3" /> Gerenciar Todos os Pedidos
          </h1>
        </header>

        <main className="flex-1 p-6 space-y-6">
          
          {/* Tabela de Pedidos */}
          <Card className="shadow-lg">
            <CardContent className="p-0">
              {displayLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
                </div>
              ) : pedidos.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum pedido encontrado na plataforma.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido #</TableHead>
                      <TableHead>Lojista</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Data</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidos.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium">{pedido.id.substring(0, 8)}</TableCell>
                        <TableCell>{userNamesMap[pedido.lojista_id] || `Lojista ID: ${pedido.lojista_id.substring(0, 8)}`}</TableCell>
                        <TableCell className="text-atacado-primary">{userNamesMap[pedido.fornecedor_id] || `Fornecedor ID: ${pedido.fornecedor_id.substring(0, 8)}`}</TableCell>
                        <TableCell className="text-right font-bold text-atacado-accent">{formatCurrency(pedido.total_atacado)}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(pedido.status)}</TableCell>
                        <TableCell className="text-center text-sm">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-atacado-primary"
                            onClick={() => handleOpenModal(pedido.id)}
                          >
                            Detalhes <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>

        <footer className="p-4 border-t bg-white">
          <MadeWithDyad />
        </footer>
      </div>

      {/* Reutiliza o modal de fornecedor, pois ele tem a lógica de atualização de status e frete */}
      <PedidoDetalhesFornecedorModal
        pedidoId={selectedPedidoId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={fetchPedidos}
      />
    </div>
  );
};

export default GerenciarPedidosAdmin;