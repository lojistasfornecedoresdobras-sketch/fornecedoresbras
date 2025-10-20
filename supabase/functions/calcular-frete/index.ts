// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- CONFIGURAÇÃO DO MELHOR ENVIO (MOCK) ---
// O token real deve ser configurado como um segredo no Supabase Console.
// @ts-ignore
const MELHOR_ENVIO_TOKEN = Deno.env.get('MELHOR_ENVIO_TOKEN') || 'MOCK_TOKEN_12345';
const MELHOR_ENVIO_URL = 'https://api.melhorenvio.com.br/api/v2/me/shipment/calculate'; // URL real

// Função de simulação de chamada à API do Melhor Envio
async function mockMelhorEnvioCalculation(payload: any) {
    // Em um ambiente real, você faria um fetch para a MELHOR_ENVIO_URL
    // usando o MELHOR_ENVIO_TOKEN no header Authorization.
    
    console.log("Simulando cálculo de frete para payload:", payload);

    // Simulação de resposta da API
    const mockRates = [
        {
            id: 1,
            name: "Correios PAC",
            price: 25.50,
            delivery_time: 10,
            error: null
        },
        {
            id: 2,
            name: "Jadlog .Package",
            price: 35.90,
            delivery_time: 5,
            error: null
        },
    ];

    // Se o peso for muito alto, simula erro
    const totalWeight = payload.volumes.reduce((sum: number, vol: any) => sum + vol.weight, 0);
    if (totalWeight > 50) {
        return [{ error: "Peso máximo excedido para esta região." }];
    }

    return mockRates;
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
  
  // Cliente Supabase com o token JWT do usuário
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

  const { lojistaId, fornecedorId, items, cepDestino } = data;

  if (!lojistaId || !fornecedorId || !items || !cepDestino) {
    return new Response(JSON.stringify({ error: 'Missing required fields (lojistaId, fornecedorId, items, cepDestino)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    // 2. Buscar CEP de Origem do Fornecedor
    const { data: fornecedorProfile, error: profileError } = await supabase
      .from('usuarios')
      .select('endereco') // Assumindo que o CEP está no campo 'endereco' ou que o 'endereco' contém o CEP
      .eq('id', fornecedorId)
      .single();

    if (profileError || !fornecedorProfile?.endereco) {
        console.error('Fornecedor address not found:', profileError);
        return new Response(JSON.stringify({ error: 'Endereço de origem do fornecedor não encontrado.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // MOCK: Extrair CEP do endereço (Em um cenário real, teríamos um campo CEP dedicado)
    const cepOrigem = fornecedorProfile.endereco.split(',')[0].trim() || '01001000'; 

    // 3. Preparar Volumes para o Melhor Envio
    const volumes = items.map((item: any) => {
        // Multiplica as dimensões e peso pela quantidade de unidades de atacado (DZ/PC/CX)
        // Nota: O Melhor Envio espera dimensões em cm e peso em kg.
        return {
            weight: item.peso_kg * item.quantity,
            width: item.largura_cm,
            height: item.altura_cm,
            length: item.comprimento_cm,
        };
    });

    // 4. Montar Payload da Cotação
    const quotePayload = {
        from: {
            postal_code: cepOrigem,
        },
        to: {
            postal_code: cepDestino,
        },
        volumes: volumes,
        options: {
            insurance_value: items.reduce((sum: number, item: any) => sum + item.priceAtacado * item.quantity, 0),
            receipt: false,
            own_hand: false,
        },
    };

    // 5. Chamar API (Mock)
    const rates = await mockMelhorEnvioCalculation(quotePayload);

    // 6. Retornar as Cotações
    return new Response(
      JSON.stringify({ 
        rates: rates,
        origin: cepOrigem,
        destination: cepDestino,
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