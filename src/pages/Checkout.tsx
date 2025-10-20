import React, { useMemo, useState, useEffect } from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, ShoppingCart, Package, Loader2, ArrowLeft } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useB2BUserNames } from '@/hooks/use-b2b-user-names';

// Tipagem para o agrupamento
interface CartItemWithFornecedor {
  id: string;
  name: string;
  priceAtacado: number;
  unit: 'DZ' | 'PC' | 'CX';
  quantity: number;
  imageUrl: string;
  fornecedorId: string;
}

interface GroupedOrder {
  fornecedorId: string;
  fornecedorNome: string;
  items: CartItemWithFornecedor[];
  subtotal: number;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { b2bProfile, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (value: number) => {
    return `R$${value.toFixed(2).replace('.', ',')}`;
  };

  // 1. Identificar IDs únicos dos fornecedores no carrinho
  const uniqueFornecedorIds = useMemo(() => 
    Array.from(new Set(items.map(item => item.fornecedorId))), 
    [items]
  );

  // 2. Buscar nomes fantasia dos fornecedores
  const { userNames: fornecedoresMap, isLoading: isFetchingFornecedores } = useB2BUserNames(uniqueFornecedorIds);

  // 3. Agrupar itens por Fornecedor
  const groupedOrders: GroupedOrder[] = useMemo(() => {
    if (items.length === 0 || isFetchingFornecedores) return [];

    const groups = items.reduce((acc, item) => {
      const id = item.fornecedorId;
      const fornecedorNome = fornecedoresMap[id] || `Fornecedor ID: ${id.substring(0, 8)}`;

      if (!acc[id]) {
        acc[id] = {
          fornecedorId: id,
          fornecedorNome: fornecedorNome,
          items: [],
          subtotal: 0,
        };
      }
      acc[id].items.push(item as CartItemWithFornecedor);
      acc[id].subtotal += item.priceAtacado * item.quantity;
      return acc;
    }, {} as Record<string, GroupedOrder>);

    return Object.values(groups);
  }, [items, fornecedoresMap, isFetchingFornecedores]);


  const handleFinalizeOrder = async () => {
    if (!b2bProfile || !user || groupedOrders.length === 0) {
      showError("Erro: Dados do usuário ou carrinho inválidos.");
      return;
    }

    setIsProcessing(true);

    try {
      let successfulOrders = 0;

      for (const group of groupedOrders) {
        // 2. Criar o Pedido Principal para cada fornecedor
        const orderData = {
          lojista_id: user.id,
          fornecedor_id: group.fornecedorId,
          total_atacado: group.subtotal,
          status: 'Aguardando Pagamento',
        };

        const { data: order, error: orderError } = await supabase
          .from('pedidos')
          .insert([orderData])
          .select()
          .single();

        if (orderError || !order) {
          throw new Error(orderError?.message || `Falha ao criar pedido para ${group.fornecedorNome}.`);
        }

        const pedidoId = order.id;

        // 3. Criar os Itens do Pedido
        const orderItemsData = group.items.map(item => ({
          pedido_id: pedidoId,
          produto_id: item.id,
          quantidade_dz_pc_cx: item.quantity,
          preco_unitario_atacado: item.priceAtacado,
          subtotal_atacado: item.priceAtacado * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('itens_pedido')
          .insert(orderItemsData);

        if (itemsError) {
          throw new Error(itemsError.message || `Falha ao inserir itens do pedido #${pedidoId.substring(0, 8)}.`);
        }
        successfulOrders++;
      }

      showSuccess(`Sucesso! ${successfulOrders} pedido(s) criado(s). Aguardando pagamento.`);
      clearCart();
      navigate('/meus-pedidos'); // Redireciona para a página de pedidos do lojista
      
    } catch (error: any) {
      console.error("Erro no Checkout:", error);
      showError("Falha ao finalizar o pedido: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-atacado-background">
        <HeaderAtacado />
        <main className="container mx-auto p-4 pt-10 text-center">
          <h1 className="text-2xl font-bold text-atacado-primary">Checkout</h1>
          <p className="text-gray-600 mt-4">Seu carrinho está vazio. Adicione itens para prosseguir.</p>
          <Button onClick={() => navigate('/catalogo')} className="mt-6 bg-atacado-accent hover:bg-orange-600">
            Voltar ao Catálogo
          </Button>
        </main>
        <MadeWithDyad />
      </div>
    );
  }
  
  if (isFetchingFornecedores) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-atacado-background">
        <Loader2 className="h-8 w-8 animate-spin text-atacado-primary" />
        <p className="ml-3 text-atacado-primary">Preparando resumo do pedido...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/carrinho')}>
            <ArrowLeft className="w-6 h-6 text-atacado-primary" />
          </Button>
          <h1 className="text-3xl font-bold text-atacado-primary">FINALIZAR PEDIDO ({groupedOrders.length} Fornecedor{groupedOrders.length > 1 ? 'es' : ''})</h1>
        </div>

        {groupedOrders.map((group, index) => (
          <Card key={group.fornecedorId} className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-xl text-atacado-primary flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Pedido para: {group.fornecedorNome}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* Lista de Itens */}
              {group.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                  <div className="flex items-center">
                    <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="w-10 h-10 object-cover rounded mr-3" />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} x {item.unit}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-atacado-accent">
                    {formatCurrency(item.priceAtacado * item.quantity)}
                  </p>
                </div>
              ))}

              <Separator />

              {/* Subtotal */}
              <div className="flex justify-between text-lg font-bold text-atacado-primary">
                <span>Subtotal (Produtos)</span>
                <span>{formatCurrency(group.subtotal)}</span>
              </div>
              
              {/* Frete Mock */}
              <div className="flex justify-between text-gray-700">
                <span>Frete Estimado</span>
                <span className="text-green-600">R$ 0,00 (Mock)</span>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-2xl font-bold text-atacado-accent">
                <span>TOTAL A PAGAR</span>
                <span>{formatCurrency(group.subtotal)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Botão de Finalização Global */}
        <Card className="shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-atacado-primary">TOTAL GERAL</h2>
            <span className="text-3xl font-bold text-atacado-accent">{formatCurrency(totalPrice)}</span>
          </div>
          <Button 
            className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3"
            onClick={handleFinalizeOrder}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : `CONFIRMAR ${groupedOrders.length} PEDIDO(S) E PAGAR`}
          </Button>
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

export default Checkout;