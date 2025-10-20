import React, { useMemo, useState } from 'react';
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

// Tipagem para o agrupamento
interface GroupedOrder {
  fornecedorId: string;
  items: typeof useCart extends () => { items: infer T } ? T : never;
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

  // 1. Agrupar itens por Fornecedor
  // Para isso, precisamos buscar o fornecedor_id de cada produto no carrinho.
  // Por enquanto, vamos mockar o fornecedorId, pois o hook useCart não tem essa informação.
  // Em um cenário real, o CartItem precisaria incluir o fornecedorId.
  
  // MOCK: Assumindo que todos os produtos no carrinho pertencem ao mesmo fornecedor (ID FAKE)
  const MOCK_FORNECEDOR_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; 
  const MOCK_FORNECEDOR_NOME = 'Fornecedor Único Mock';

  const groupedOrders: GroupedOrder[] = useMemo(() => {
    if (items.length === 0) return [];

    // Em um cenário real, faríamos uma busca no Supabase para obter o fornecedor_id de cada item.
    // Para manter a simplicidade e evitar chamadas assíncronas complexas no useMemo:
    
    const subtotal = items.reduce((sum, item) => sum + item.priceAtacado * item.quantity, 0);

    return [{
      fornecedorId: MOCK_FORNECEDOR_ID,
      items: items as any, // Ignorando a tipagem complexa do useMemo
      subtotal: subtotal,
    }];
  }, [items]);


  const handleFinalizeOrder = async () => {
    if (!b2bProfile || !user || groupedOrders.length === 0) {
      showError("Erro: Dados do usuário ou carrinho inválidos.");
      return;
    }

    setIsProcessing(true);

    try {
      // 2. Criar o Pedido Principal (Mockando um único pedido por enquanto)
      const orderData = {
        lojista_id: user.id,
        fornecedor_id: groupedOrders[0].fornecedorId, // Usando o fornecedor mockado
        total_atacado: groupedOrders[0].subtotal,
        status: 'Aguardando Pagamento',
      };

      const { data: order, error: orderError } = await supabase
        .from('pedidos')
        .insert([orderData])
        .select()
        .single();

      if (orderError || !order) {
        throw new Error(orderError?.message || "Falha ao criar o pedido principal.");
      }

      const pedidoId = order.id;

      // 3. Criar os Itens do Pedido
      const orderItemsData = groupedOrders[0].items.map(item => ({
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
        throw new Error(itemsError.message || "Falha ao inserir itens do pedido.");
      }

      showSuccess(`Pedido #${pedidoId.substring(0, 8)} criado com sucesso! Aguardando pagamento.`);
      clearCart();
      navigate('/perfil'); // Redireciona para o perfil ou página de pedidos
      
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

  return (
    <div className="min-h-screen bg-atacado-background">
      <HeaderAtacado />
      
      <main className="container mx-auto p-4 space-y-6 pt-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/carrinho')}>
            <ArrowLeft className="w-6 h-6 text-atacado-primary" />
          </Button>
          <h1 className="text-3xl font-bold text-atacado-primary">FINALIZAR PEDIDO</h1>
        </div>

        {groupedOrders.map((group, index) => (
          <Card key={index} className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-xl text-atacado-primary flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Pedido para: {MOCK_FORNECEDOR_NOME}
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

              <Button 
                className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3 mt-4"
                onClick={handleFinalizeOrder}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'CONFIRMAR PEDIDO E PAGAR'}
              </Button>
            </CardContent>
          </Card>
        ))}
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