import React, { useMemo, useState, useEffect } from 'react';
import HeaderAtacado from '@/components/HeaderAtacado';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Truck, ShoppingCart, Package, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useB2BUserNames } from '@/hooks/use-b2b-user-names';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FreteCalculator from '@/components/FreteCalculator';
import PixPaymentModal from '@/components/PixPaymentModal'; // Importando o modal

// Tipagem para o agrupamento
interface CartItemWithFornecedor {
  id: string;
  name: string;
  priceAtacado: number;
  unit: 'DZ' | 'PC' | 'CX';
  quantity: number;
  imageUrl: string;
  fornecedorId: string;
  // Campos de Frete
  peso_kg: number;
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
}

interface FreteRate {
    id: number;
    name: string;
    price: number;
    delivery_time: number;
    error: string | null;
}

interface GroupedOrder {
  fornecedorId: string;
  fornecedorNome: string;
  items: CartItemWithFornecedor[];
  subtotal: number;
  totalUnits: number; // NOVO: Total de unidades (peças) neste grupo
  pedidoId?: string; // Adicionado para armazenar o ID do pedido criado
}

// Estado para armazenar a taxa de frete selecionada por fornecedor
interface SelectedFreteMap {
    [fornecedorId: string]: FreteRate | null;
}

interface PixDetails {
  pedidoId: string;
  pagarmeId: string;
  totalPago: string;
  qr_code: string;
  qr_code_text: string;
}

const MIN_UNITS_PER_SUPPLIER = 6;

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart, calculateTotalUnits } = useCart();
  const { b2bProfile, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cepDestino, setCepDestino] = useState('');
  const [groupedOrdersState, setGroupedOrdersState] = useState<GroupedOrder[]>([]);
  const [selectedFretes, setSelectedFretes] = useState<SelectedFreteMap>({});
  
  // Estado do PIX
  const [pixDetails, setPixDetails] = useState<PixDetails | null>(null);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);


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

  // 3. Agrupar itens por Fornecedor e calcular total de unidades
  useEffect(() => {
    if (items.length === 0 || isFetchingFornecedores) {
      setGroupedOrdersState([]);
      return;
    }

    const groups = items.reduce((acc, item) => {
      const id = item.fornecedorId;
      const fornecedorNome = fornecedoresMap[id] || `Fornecedor ID: ${id.substring(0, 8)}`;
      const units = calculateTotalUnits(item); // Calcula unidades (peças)

      if (!acc[id]) {
        acc[id] = {
          fornecedorId: id,
          fornecedorNome: fornecedorNome,
          items: [],
          subtotal: 0,
          totalUnits: 0, // Inicializa
        };
      }
      acc[id].items.push(item as CartItemWithFornecedor);
      acc[id].subtotal += item.priceAtacado * item.quantity;
      acc[id].totalUnits += units; // Soma as unidades
      return acc;
    }, {} as Record<string, GroupedOrder>);

    setGroupedOrdersState(Object.values(groups));
  }, [items, fornecedoresMap, isFetchingFornecedores, calculateTotalUnits]);

  // 4. Gerenciar seleção de frete
  const handleRateSelected = (fornecedorId: string, rate: FreteRate | null) => {
    setSelectedFretes(prev => ({
        ...prev,
        [fornecedorId]: rate,
    }));
  };

  // 5. Calcular totais de frete e geral
  const totalFrete = useMemo(() => {
    return Object.values(selectedFretes).reduce((sum, rate) => sum + (rate?.price || 0), 0);
  }, [selectedFretes]);

  const totalGeral = totalPrice + totalFrete;

  // 6. Validação para prosseguir
  const isFreteSelectedForAll = useMemo(() => {
    if (groupedOrdersState.length === 0) return false;
    return groupedOrdersState.every(group => selectedFretes[group.fornecedorId] && selectedFretes[group.fornecedorId]?.price !== undefined);
  }, [groupedOrdersState, selectedFretes]);
  
  // NOVO: Validação de Mínimo por Fornecedor
  const isMinimumMetForAll = useMemo(() => {
    if (groupedOrdersState.length === 0) return false;
    return groupedOrdersState.every(group => group.totalUnits >= MIN_UNITS_PER_SUPPLIER);
  }, [groupedOrdersState]);

  const handlePaymentConfirmed = () => {
    clearCart();
    navigate('/meus-pedidos');
  };

  const handleFinalizeOrder = async () => {
    if (!b2bProfile || !user || groupedOrdersState.length === 0) {
      showError("Erro: Dados do usuário ou carrinho inválidos.");
      return;
    }
    if (!isMinimumMetForAll) {
        showError(`O pedido mínimo é de ${MIN_UNITS_PER_SUPPLIER} unidades totais por fornecedor. Por favor, adicione mais itens.`);
        return;
    }
    if (!isFreteSelectedForAll) {
        showError("Por favor, selecione uma opção de frete para todos os fornecedores.");
        return;
    }

    setIsProcessing(true);
    let successfulOrders = 0;
    const createdOrderIds: string[] = [];
    let firstPixDetails: PixDetails | null = null;

    try {
      // 1. Criar todos os pedidos e itens primeiro (Status: Aguardando Pagamento)
      const ordersToProcess: GroupedOrder[] = [];

      for (const group of groupedOrdersState) {
        const freteSelecionado = selectedFretes[group.fornecedorId];
        if (!freteSelecionado) continue;

        // 1a. Criar o Pedido Principal para cada fornecedor
        const orderData = {
          lojista_id: user.id,
          fornecedor_id: group.fornecedorId,
          // O total_atacado aqui é apenas o valor dos produtos. O frete será adicionado ao pagamento.
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
        createdOrderIds.push(pedidoId);

        // 1b. Criar os Itens do Pedido
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
        
        // 1c. Registrar o Frete Selecionado
        const freteData = {
            pedido_id: pedidoId,
            melhor_envio_id: freteSelecionado.id.toString(),
            transportadora: freteSelecionado.name,
            custo: freteSelecionado.price,
            // O status inicial do frete pode ser 'Aguardando Etiqueta'
            status: 'Aguardando Etiqueta', 
        };

        const { error: freteError } = await supabase
            .from('fretes')
            .insert([freteData]);

        if (freteError) {
            throw new Error(freteError.message || `Falha ao registrar frete para o pedido #${pedidoId.substring(0, 8)}.`);
        }

        ordersToProcess.push({ ...group, pedidoId });
      }

      // 2. Processar Pagamento para cada pedido via Edge Function
      for (const order of ordersToProcess) {
        if (!order.pedidoId) continue;
        
        // Busca o frete para incluir no total do pagamento
        const freteRate = selectedFretes[order.fornecedorId];
        const totalComFrete = order.subtotal + (freteRate?.price || 0);

        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('processar-pagamento', {
          body: { 
            pedidoId: order.pedidoId,
            totalComFrete: totalComFrete, // Passa o total com frete
          },
        });

        if (paymentError) {
          // Se o pagamento falhar, o pedido permanece em 'Aguardando Pagamento'
          console.error(`Falha no pagamento do pedido ${order.pedidoId.substring(0, 8)}:`, paymentError);
          showError(`Falha ao processar pagamento para ${order.fornecedorNome}. O pedido foi criado, mas o pagamento falhou.`);
        } else {
          successfulOrders++;
          
          // Captura os detalhes do PIX do primeiro pedido para exibição
          if (!firstPixDetails) {
            firstPixDetails = {
                pedidoId: order.pedidoId,
                pagarmeId: paymentData.pagarmeId,
                totalPago: paymentData.split.totalPago,
                qr_code: paymentData.pix_details.qr_code,
                qr_code_text: paymentData.pix_details.qr_code_text,
            };
          }
        }
      }

      if (successfulOrders > 0) {
        // Se houver apenas um pedido, exibe o PIX. Se houver múltiplos, exibe o PIX do primeiro
        // e informa o usuário que ele deve verificar a página de pedidos para os demais.
        if (firstPixDetails) {
            setPixDetails(firstPixDetails);
            setIsPixModalOpen(true);
        } else {
            // Caso raro onde pedidos foram criados mas o pagamento falhou para todos
            showError("Pedidos criados, mas o pagamento falhou para todos. Verifique a página de pedidos.");
            clearCart();
            navigate('/meus-pedidos');
        }
      } else {
        showError("Nenhum pedido foi processado com sucesso. Verifique o status dos pedidos.");
      }
      
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
          <h1 className="text-3xl font-bold text-atacado-primary">FINALIZAR PEDIDO ({groupedOrdersState.length} Fornecedor{groupedOrdersState.length > 1 ? 'es' : ''})</h1>
        </div>

        {/* 1. Entrada de CEP de Destino */}
        <Card className="shadow-lg border-l-4 border-atacado-accent">
            <CardHeader>
                <CardTitle className="text-xl text-atacado-primary flex items-center">
                    <MapPin className="w-5 h-5 mr-2" /> 1. Endereço de Entrega
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-w-sm">
                    <Label htmlFor="cepDestino">CEP de Destino</Label>
                    <Input 
                        id="cepDestino"
                        placeholder="Apenas números, ex: 01001000"
                        value={cepDestino}
                        onChange={(e) => setCepDestino(e.target.value.replace(/\D/g, '').substring(0, 8))}
                        maxLength={8}
                        required
                    />
                </div>
                {cepDestino.length === 8 && (
                    <p className="text-sm text-green-600 mt-2">CEP pronto para cálculo de frete.</p>
                )}
            </CardContent>
        </Card>

        {/* 2. Agrupamento e Cálculo de Frete por Fornecedor */}
        {groupedOrdersState.map((group, index) => (
          <Card key={group.fornecedorId} className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-xl text-atacado-primary flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Pedido {index + 1}: {group.fornecedorNome}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* Validação de Mínimo */}
              {group.totalUnits < MIN_UNITS_PER_SUPPLIER && (
                <div className="p-3 bg-red-100 border border-red-400 rounded-lg text-red-700 font-medium text-sm">
                    ⚠️ Mínimo não atingido: Adicione mais {MIN_UNITS_PER_SUPPLIER - group.totalUnits} unidades (peças) para este fornecedor.
                </div>
              )}

              {/* Lista de Itens (Resumo) */}
              <div className="space-y-2">
                <h3 className="font-semibold text-atacado-primary">Itens ({group.items.length})</h3>
                {group.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b pb-1 last:border-b-0">
                    <div className="flex items-center">
                      <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="w-8 h-8 object-cover rounded mr-3" />
                      <p className="text-gray-700">
                        {item.quantity}x {item.unit} de {item.name}
                      </p>
                    </div>
                    <p className="font-medium text-right">
                      {formatCurrency(item.priceAtacado * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />
              
              {/* Calculadora de Frete */}
              <FreteCalculator
                orderGroup={group}
                lojistaId={user?.id || ''}
                cepDestino={cepDestino}
                onRatesCalculated={() => {}} // Não precisamos de ação aqui, apenas no estado local
                onRateSelected={handleRateSelected}
                selectedRate={selectedFretes[group.fornecedorId] || null}
              />

              <Separator />

              {/* Resumo Financeiro do Grupo */}
              <div className="flex justify-between text-lg font-bold text-atacado-primary">
                <span>Subtotal Produtos</span>
                <span>{formatCurrency(group.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Frete Selecionado</span>
                <span className={selectedFretes[group.fornecedorId] ? "text-green-600 font-bold" : "text-red-500"}>
                    {selectedFretes[group.fornecedorId] ? formatCurrency(selectedFretes[group.fornecedorId]?.price || 0) : 'Aguardando seleção'}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-atacado-accent border-t pt-2">
                <span>TOTAL DO PEDIDO</span>
                <span>{formatCurrency(group.subtotal + (selectedFretes[group.fornecedorId]?.price || 0))}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* 3. Botão de Finalização Global */}
        <Card className="shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-atacado-primary">TOTAL GERAL DA COMPRA</h2>
            <span className="text-3xl font-bold text-atacado-accent">{formatCurrency(totalGeral)}</span>
          </div>
          <Button 
            className="w-full bg-atacado-accent hover:bg-orange-600 text-white font-bold py-3"
            onClick={handleFinalizeOrder}
            disabled={isProcessing || !isFreteSelectedForAll || cepDestino.length !== 8 || !isMinimumMetForAll} // Adiciona validação de mínimo
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : `CONFIRMAR ${groupedOrdersState.length} PEDIDO(S) E PAGAR ${formatCurrency(totalGeral)}`}
          </Button>
          {(!isFreteSelectedForAll || !isMinimumMetForAll || cepDestino.length !== 8) && (
            <p className="text-sm text-red-500 mt-2 text-center">
                {cepDestino.length !== 8 && "Preencha o CEP de destino. "}
                {!isMinimumMetForAll && `O pedido mínimo é de ${MIN_UNITS_PER_SUPPLIER} unidades por fornecedor. `}
                {!isFreteSelectedForAll && "Selecione o frete para todos os fornecedores."}
            </p>
          )}
        </Card>
      </main>

      <footer className="mt-10 bg-atacado-primary text-white p-4 text-center">
        <p className="flex items-center justify-center font-medium">
          Atacado Brás - Entrega Rápida! <Truck className="w-5 h-5 ml-2" />
        </p>
        <MadeWithDyad />
      </footer>
      
      {/* Modal de Pagamento PIX */}
      <PixPaymentModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        pixDetails={pixDetails}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
};

export default Checkout;