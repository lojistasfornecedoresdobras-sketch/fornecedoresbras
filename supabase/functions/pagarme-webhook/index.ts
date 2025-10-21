// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cliente Supabase com Service Role Key (para escrita segura no banco de dados)
// @ts-ignore
const adminSupabase = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Em um cenário real, você verificaria a assinatura do webhook (signature header)
  // para garantir que a requisição veio do Pagar.me.

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  console.log("Pagar.me Webhook Payload Recebido:", payload);

  // Simulação de extração de dados relevantes do payload do Pagar.me
  // O Pagar.me envia um objeto complexo, mas focamos no ID da transação e no novo status.
  const { 
    id: pagarme_id, 
    status: novo_status, 
    object: object_type 
  } = payload;

  if (object_type !== 'transaction' || !pagarme_id || !novo_status) {
    return new Response(JSON.stringify({ error: 'Invalid or unsupported payload structure' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    // 1. Atualizar o status na tabela 'pagamentos' usando o pagar_me_id
    const { data: pagamentoData, error: pagamentoError } = await adminSupabase
      .from('pagamentos')
      .update({ status: novo_status })
      .eq('pagar_me_id', pagarme_id)
      .select('pedido_id')
      .single();

    if (pagamentoError) {
      console.error('Error updating payment status:', pagamentoError);
      // Se o erro for 'No rows found' (PGRST116), apenas logamos e retornamos 200
      if (pagamentoError.code !== 'PGRST116') {
        throw new Error(`Falha ao atualizar status do pagamento: ${pagamentoError.message}`);
      }
    }
    
    // 2. Se o pagamento foi confirmado ('paid' ou 'approved'), atualiza o status do pedido
    if (pagamentoData?.pedido_id && (novo_status === 'paid' || novo_status === 'approved')) {
        await adminSupabase
            .from('pedidos')
            .update({ status: 'Em Processamento' })
            .eq('id', pagamentoData.pedido_id);
    }
    
    // 3. Se o pagamento falhou, atualiza o status do pedido para 'Cancelado'
    if (pagamentoData?.pedido_id && (novo_status === 'failed' || novo_status === 'refused')) {
        await adminSupabase
            .from('pedidos')
            .update({ status: 'Cancelado' })
            .eq('id', pagamentoData.pedido_id);
    }


    return new Response(
      JSON.stringify({ 
        message: `Status do pagamento ${pagarme_id} atualizado para ${novo_status}.`,
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