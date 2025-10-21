// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Chave Secreta do Pagar.me (deve ser configurada como um segredo no Supabase Console)
// @ts-ignore
const PAGARME_API_KEY = Deno.env.get('PAGARME_API_KEY');

// Cliente Supabase com Service Role Key (para operações administrativas, como buscar a taxa de comissão)
// @ts-ignore
const adminSupabase = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Função de simulação de chamada à API do Pagar.me
async function mockPagarmeTransaction(transactionData: any) {
    console.log("Simulando transação Pagar.me com chave:", PAGARME_API_KEY ? 'Chave Carregada' : 'Chave Ausente');
    console.log("Dados da Transação (Mock):", transactionData);

    // Simulação de resposta da API para PIX (assumindo que o pagamento foi confirmado via webhook)
    return {
        status: 'paid', // Simula pagamento aprovado
        id: `pagarme_pix_${transactionData.pedidoId.substring(0, 8)}_${Date.now()}`,
        amount: transactionData.totalComFrete * 100, // Pagar.me usa centavos
        payment_method: 'pix', // Simula Pix
        installments: 1, 
        // Em um cenário real, aqui viria o payload do Pix (QR Code, Pix Copy/Paste)
        pix_code: '00020126330014BR.GOV.BCB.PIX0111123456789015204000053039865802BR5925NOME DO RECEBEDOR MOCK6008BRASILIA62070503***63041D3D',
    };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. Autenticação (Obrigatória para garantir que o usuário está logado)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  
  // Cliente Supabase com o token JWT do usuário (para RLS)
  // @ts-ignore
  const supabase = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { authorization: authHeader },
      },
    }
  )

  let data;
  try {
    data = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Recebe o totalComFrete do cliente
  const { pedidoId, totalComFrete } = data; 

  if (!pedidoId || totalComFrete === undefined) {
    return new Response(JSON.stringify({ error: 'Missing required fields (pedidoId, totalComFrete) in request body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    // 2. Buscar Pedido e Taxa de Comissão Ativa (Usando adminSupabase para garantir acesso à taxa)
    
    // Busca o pedido (apenas para verificar status e total_atacado)
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, total_atacado, lojista_id, fornecedor_id, status')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error('Pedido not found or error:', pedidoError);
      return new Response(JSON.stringify({ error: 'Pedido não encontrado ou erro de acesso.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pedido.status !== 'Aguardando Pagamento') {
        return new Response(JSON.stringify({ error: `Pedido já processado. Status atual: ${pedido.status}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Busca a taxa de comissão ativa (Usando adminSupabase para ignorar RLS)
    const { data: taxaData, error: taxaError } = await adminSupabase
      .from('taxas_comissao')
      .select('taxa')
      .eq('ativo', true)
      .order('data_definicao', { ascending: false })
      .limit(1)
      .single();

    const taxaComissao = taxaData?.taxa || 0; // 0% se não houver taxa definida

    // 3. Calcular Split
    const valorProdutos = pedido.total_atacado;
    const valorFrete = totalComFrete - valorProdutos;
    
    const comissaoPlataforma = valorProdutos * (taxaComissao / 100);
    
    // Repasse ao fornecedor = Valor dos Produtos - Comissão + Valor do Frete
    const splitFornecedor = valorProdutos - comissaoPlataforma + valorFrete;
    const splitPlataforma = comissaoPlataforma; 

    // 4. Simular Transação Pagar.me (agora simulando Pix)
    const transactionData = {
        pedidoId: pedidoId,
        totalComFrete: totalComFrete,
        // Em um cenário real, aqui iriam os dados do cartão/boleto
        // e os IDs dos recebedores (fornecedor e plataforma)
        splits: [
            { recipient_id: pedido.fornecedor_id, amount: Math.round(splitFornecedor * 100) },
            { recipient_id: 'PLATFORM_ID_MOCK', amount: Math.round(splitPlataforma * 100) },
        ]
    };

    const pagarmeResponse = await mockPagarmeTransaction(transactionData);

    if (pagarmeResponse.status !== 'paid') {
        // Se estivéssemos simulando o fluxo completo do Pix, o status seria 'pending' aqui.
        // Mas para o checkout, assumimos sucesso.
        throw new Error(`Pagamento recusado pelo Pagar.me. Status: ${pagarmeResponse.status}`);
    }

    // 5. Registrar Pagamento
    const pagamentoData = {
      pedido_id: pedidoId,
      valor_total: totalComFrete, // Valor total pago pelo lojista (Produtos + Frete)
      status: 'Aprovado',
      metodo: pagarmeResponse.payment_method, // 'pix'
      parcelas: pagarmeResponse.installments,
      split_fornecedor: splitFornecedor,
      split_plataforma: splitPlataforma,
      pagar_me_id: pagarmeResponse.id,
    };

    const { error: pagamentoError } = await adminSupabase // Usando adminSupabase para garantir que o pagamento seja registrado
      .from('pagamentos')
      .insert([pagamentoData]);

    if (pagamentoError) {
      console.error('Error inserting payment:', pagamentoError);
      throw new Error('Falha ao registrar pagamento no banco de dados.');
    }

    // 6. Atualizar Status do Pedido
    const { error: updateError } = await adminSupabase // Usando adminSupabase para garantir que o status seja atualizado
      .from('pedidos')
      .update({ 
        status: 'Em Processamento',
        pagar_me_transaction_id: pagarmeResponse.id, // Salva o ID da transação
      })
      .eq('id', pedidoId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw new Error('Falha ao atualizar status do pedido.');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Pagamento Pix processado e pedido atualizado.',
        pedidoId: pedidoId,
        pagarmeId: pagarmeResponse.id,
        paymentMethod: pagarmeResponse.payment_method,
        split: {
          totalPago: totalComFrete.toFixed(2),
          fornecedor: splitFornecedor.toFixed(2),
          plataforma: splitPlataforma.toFixed(2),
          taxa: taxaComissao,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})