// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Chave Secreta do Pagar.me (deve ser configurada como um segredo no Supabase Console)
// Adicionando MOCK para desenvolvimento
// @ts-ignore
const PAGARME_API_KEY = Deno.env.get('PAGARME_API_KEY') || 'sk_MOCK_API_KEY'; 
const PAGARME_API_URL = 'https://api.pagar.me/1/transactions';

// ID MOCK do Recebedor da Plataforma (Admin)
const PLATFORM_RECIPIENT_ID = 're_PLATFORM_MOCK_ID';

// Cliente Supabase com Service Role Key (para operações administrativas, como buscar a taxa de comissão e dados do fornecedor)
// @ts-ignore
const adminSupabase = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Função para criar a transação real no Pagar.me
async function createPagarmeTransaction(transactionData: any) {
    if (PAGARME_API_KEY === 'sk_MOCK_API_KEY') {
        console.warn("Usando MOCK API KEY. Simulação de transação Pagar.me.");
        // Simula uma resposta de sucesso do Pagar.me para Pix
        return {
            id: `tr_mock_${Date.now()}`,
            status: 'waiting_payment',
            qr_code: 'MOCK_QR_CODE_DATA',
            qr_code_text: 'MOCK_QR_CODE_TEXT',
        };
    }

    const response = await fetch(PAGARME_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Autenticação Basic Auth: 'sk_live_...' + ':'
            'Authorization': `Basic ${btoa(PAGARME_API_KEY + ':')}`, 
        },
        body: JSON.stringify(transactionData),
    });

    const result = await response.json();

    if (!response.ok) {
        console.error("Pagar.me API Error:", result);
        throw new Error(`Falha na transação Pagar.me: ${result.errors?.[0]?.message || result.message || 'Erro desconhecido'}`);
    }

    return result;
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
    // 2. Buscar Pedido e Taxa de Comissão Ativa
    
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
    const { data: taxas, error: taxaError } = await adminSupabase
      .from('taxas_comissao')
      .select('taxa')
      .eq('ativo', true)
      .order('data_definicao', { ascending: false })
      .limit(1); // Usamos limit(1) em vez de single() para evitar erro se a tabela estiver vazia

    if (taxaError) {
        console.error('Error fetching commission rate:', taxaError);
    }
    
    const taxaComissao = taxas?.[0]?.taxa || 0; // Usa 0% se não houver taxa definida ou se houver erro.

    // 2b. Buscar ID do Recebedor do Fornecedor (Usando adminSupabase para ignorar RLS)
    const { data: fornecedorData, error: fornecedorError } = await adminSupabase
        .from('usuarios')
        .select('pagarme_recipient_id')
        .eq('id', pedido.fornecedor_id)
        .limit(1); // Usamos limit(1) em vez de single()

    if (fornecedorError) {
        console.error('Error fetching supplier recipient ID:', fornecedorError);
    }

    let fornecedorRecipientId = fornecedorData?.[0]?.pagarme_recipient_id;

    if (!fornecedorRecipientId) {
        console.warn('Fornecedor Recipient ID not found. Using MOCK ID.');
        // Fallback MOCK para desenvolvimento
        fornecedorRecipientId = 're_MOCK_FORNECEDOR'; 
    }
    
    // 3. Calcular Split
    const valorProdutos = pedido.total_atacado;
    const valorFrete = totalComFrete - valorProdutos;
    
    const comissaoPlataforma = valorProdutos * (taxaComissao / 100);
    
    // Repasse ao fornecedor = Valor dos Produtos - Comissão + Valor do Frete
    const splitFornecedor = valorProdutos - comissaoPlataforma + valorFrete;
    const splitPlataforma = comissaoPlataforma; 

    // 4. Montar Payload da Transação Pagar.me (PIX)
    const amountInCents = Math.round(totalComFrete * 100);
    
    const transactionPayload = {
        // Dados da transação
        amount: amountInCents,
        payment_method: 'pix',
        postback_url: `https://elnzbfvdlkessfzraufu.supabase.co/functions/v1/pagarme-webhook`, // URL real do webhook
        metadata: {
            pedido_id: pedidoId,
            lojista_id: pedido.lojista_id,
            fornecedor_id: pedido.fornecedor_id,
        },
        // Configuração do Split
        split_rules: [
            { 
                recipient_id: fornecedorRecipientId, 
                amount: Math.round(splitFornecedor * 100),
                liable: true, // O fornecedor é responsável por chargebacks/fraudes
                charge_processing_fee: false, // A plataforma paga a taxa de processamento
            },
            { 
                recipient_id: PLATFORM_RECIPIENT_ID, 
                amount: Math.round(splitPlataforma * 100),
                liable: false,
                charge_processing_fee: true, // A plataforma absorve a taxa de processamento
            },
        ],
        // Dados do cliente (Mockados, em produção viriam do perfil do lojista)
        customer: {
            external_id: pedido.lojista_id,
            name: 'Lojista B2B Mock',
            email: 'lojista@atacado.com',
            type: 'company',
            country: 'br',
            documents: [{
                type: 'cnpj',
                number: '12345678000100',
            }],
        },
        // Configuração específica do Pix
        pix_expiration_date: new Date(Date.now() + 3600000).toISOString(), // 1 hora de validade
    };

    // 5. Criar Transação Real no Pagar.me
    const pagarmeResponse = await createPagarmeTransaction(transactionPayload);

    // O status inicial do Pix será 'waiting_payment' ou 'pending'
    const initialStatus = pagarmeResponse.status;

    if (initialStatus === 'refused' || initialStatus === 'failed') {
        throw new Error(`Transação recusada pelo Pagar.me. Status: ${initialStatus}`);
    }

    // 6. Registrar Pagamento (Status inicial: Waiting Payment)
    const pagamentoData = {
      pedido_id: pedidoId,
      valor_total: totalComFrete, // Valor total pago pelo lojista (Produtos + Frete)
      status: initialStatus, // waiting_payment
      metodo: 'pix',
      parcelas: 1,
      split_fornecedor: splitFornecedor,
      split_plataforma: splitPlataforma,
      pagar_me_id: pagarmeResponse.id,
    };

    const { error: pagamentoError } = await adminSupabase
      .from('pagamentos')
      .insert([pagamentoData]);

    if (pagamentoError) {
      console.error('Error inserting payment:', pagamentoError);
      throw new Error('Falha ao registrar pagamento no banco de dados.');
    }

    // 7. Atualizar Status do Pedido (Status inicial: Aguardando Pagamento)
    // Mantemos o status do pedido como 'Aguardando Pagamento'. O webhook irá atualizá-lo para 'Em Processamento' quando o Pix for pago.
    const { error: updateError } = await adminSupabase
      .from('pedidos')
      .update({ 
        pagar_me_transaction_id: pagarmeResponse.id, // Salva o ID da transação
      })
      .eq('id', pedidoId);

    if (updateError) {
      console.error('Error updating order transaction ID:', updateError);
      // Não é um erro fatal, mas deve ser logado
    }

    return new Response(
      JSON.stringify({ 
        message: 'Transação Pix criada com sucesso. Aguardando pagamento.',
        pedidoId: pedidoId,
        pagarmeId: pagarmeResponse.id,
        paymentMethod: 'pix',
        status: initialStatus,
        pix_details: {
            qr_code: pagarmeResponse.qr_code, // Dados reais do Pix
            qr_code_text: pagarmeResponse.qr_code_text,
        },
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