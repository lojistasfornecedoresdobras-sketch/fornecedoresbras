// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. Autenticação (Obrigatória para acessar dados sensíveis)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  // Cria o cliente Supabase com o token JWT do usuário
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

  const { pedidoId } = data;

  if (!pedidoId) {
    return new Response(JSON.stringify({ error: 'Missing pedidoId in request body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    // 2. Buscar Pedido e Taxa de Comissão Ativa
    
    // Busca o pedido (incluindo o total)
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

    // Busca a taxa de comissão ativa
    const { data: taxaData, error: taxaError } = await supabase
      .from('taxas_comissao')
      .select('taxa')
      .eq('ativo', true)
      .order('data_definicao', { ascending: false })
      .limit(1)
      .single();

    const taxaComissao = taxaData?.taxa || 0; // 0% se não houver taxa definida

    // 3. Calcular Split
    const valorTotal = pedido.total_atacado;
    const splitPlataforma = valorTotal * (taxaComissao / 100);
    const splitFornecedor = valorTotal - splitPlataforma;

    // 4. Registrar Pagamento (Simulação)
    const pagamentoData = {
      pedido_id: pedidoId,
      valor_total: valorTotal,
      status: 'Aprovado',
      metodo: 'Cartão de Crédito (Mock)',
      parcelas: 1,
      split_fornecedor: splitFornecedor,
      split_plataforma: splitPlataforma,
      pagar_me_id: `mock_pagar_me_${pedidoId.substring(0, 8)}`,
    };

    const { error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert([pagamentoData]);

    if (pagamentoError) {
      console.error('Error inserting payment:', pagamentoError);
      throw new Error('Falha ao registrar pagamento.');
    }

    // 5. Atualizar Status do Pedido
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ status: 'Em Processamento' })
      .eq('id', pedidoId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw new Error('Falha ao atualizar status do pedido.');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Pagamento processado e pedido atualizado.',
        pedidoId: pedidoId,
        split: {
          total: valorTotal,
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