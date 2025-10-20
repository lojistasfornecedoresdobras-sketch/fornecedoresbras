import React, { useEffect, useState } from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Truck, Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Pedido {
  id: string;
  created_at: string;
  total_atacado: number;
  status: string;
  lojista_id: string;
  // Adicionar informações do lojista (nome/email) em um cenário real, mas por enquanto usamos apenas o ID
}

const PedidosFornecedor: React.FC = () => {
  const { b2bProfile, isLoading: isAuthLoading } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && b2bProfile?.role === 'fornecedor') {
      fetchPedidos();
    }
  }, [isAuthLoading, b2bProfile]);

  const fetchPedidos = async () => {
    if (!b2bProfile?.id) return;

    setIsLoading(true);
    // Busca pedidos onde o fornecedor_id é o ID do usuário logado
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, created_at, total_atacado, status, lojista_id')
      .eq('fornecedor_id', b2bProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      showError("Erro ao carregar pedidos: " + error.message);
      console.error(error);
    } else {
      setPedidos(data as Pedido[]);
    }
    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
  };

  const getStatusBadge = (status: string) => {
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
      </div>
    );
  }

  // Redirecionamento de segurança
  if (b2bProfile?.role !== 'fornecedor') {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-atacado-primary">🛒 PEDIDOS RECEBIDOS</h1>
        </div>

        {/* Tabela de Pedidos */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-atacado-primary" />
              </div>
            ) : pedidos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum pedido recebido ainda.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido #</TableHead>
                    <TableHead>Lojista ID</TableHead>
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
                      <TableCell>{pedido.lojista_id.substring(0, 8)}...</TableCell>
                      <TableCell className="text-right font-bold text-atacado-accent">{formatCurrency(pedido.total_atacado)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(pedido.status)}</TableCell>
                      <TableCell className="text-center text-sm">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-atacado-primary">
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

      <footer className="mt-10 bg-atacado-primary text-white p-4 text-center">
        <p className="flex items-center justify-center font-medium">
          Atacado Brás - Entrega Rápida! <Truck className="w-5 h-5 ml-2" />
        </p>
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default PedidosFornecedor;