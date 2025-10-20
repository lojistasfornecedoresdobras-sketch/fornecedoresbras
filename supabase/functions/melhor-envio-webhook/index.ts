// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// O Melhor Envio pode enviar um token de segurança no header, mas vamos focar na Service Role Key
// para garantir a escrita no banco de dados.
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

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  console.log("Webhook Payload Recebido:", payload);

  // O payload do Melhor Envio para atualização de etiquetas geralmente contém:
  // { id: <melhor_envio_id>, status: <novo_status>, tracking: <codigo_rastreio> }
  const { id: melhor_envio_id, status: novo_status, tracking: codigo_rastreio } = payload;

  if (!melhor_envio_id || !novo_status) {
    return new Response(JSON.stringify({ error: 'Missing required fields (id or status) in payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    // 1. Atualizar o status na tabela 'fretes' usando o melhor_envio_id
    const { data: freteData, error: freteError } = await adminSupabase
      .from('fretes')
      .update({ 
        status: novo_status,
        // O código de rastreio pode ser atualizado aqui se for a primeira vez que ele é gerado
        codigo_rastreio: codigo_rastreio || undefined, 
      })
      .eq('melhor_envio_id', melhor_envio_id)
      .select('pedido_id')
      .single();

    if (freteError) {
      console.error('Error updating frete status:', freteError);
      throw new Error(`Falha ao atualizar status do frete: ${freteError.message}`);
    }
    
    // 2. Opcional: Atualizar o status do pedido principal se o frete atingir um marco (Ex: Enviado)
    if (freteData?.pedido_id && novo_status === 'enviado') {
        await adminSupabase
            .from('pedidos')
            .update({ status: 'Enviado' })
            .eq('id', freteData.pedido_id);
    }

    return new Response(
      JSON.stringify({ 
        message: `Status do frete ${melhor_envio_id} atualizado para ${novo_status}.`,
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