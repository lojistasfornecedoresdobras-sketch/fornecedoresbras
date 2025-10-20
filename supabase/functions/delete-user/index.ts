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

  // 1. Autenticação e Autorização (Verificar se o solicitante é Admin)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  
  // Cliente Supabase com o token JWT do usuário (para verificar a role)
  // @ts-ignore
  const userSupabase = createClient(
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

  const { data: { user }, error: userError } = await userSupabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  // Verificar a role do usuário solicitante na tabela 'usuarios'
  const { data: profile, error: profileError } = await userSupabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'administrador') {
    return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can delete users.' }), { 
      status: 403, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  // 2. Obter o ID do usuário a ser excluído
  let data;
  try {
    data = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { targetUserId } = data;

  if (!targetUserId) {
    return new Response(JSON.stringify({ error: 'Missing targetUserId in request body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  if (targetUserId === user.id) {
    return new Response(JSON.stringify({ error: 'Cannot delete your own admin account via this function.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // 3. Cliente Supabase com Service Role Key (para exclusão administrativa)
  // @ts-ignore
  const adminSupabase = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 4. Excluir o usuário do sistema de autenticação
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(targetUserId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      throw new Error(`Falha ao excluir usuário de autenticação: ${deleteAuthError.message}`);
    }

    // Nota: A exclusão do registro em public.usuarios deve ser tratada por um trigger
    // ou RLS, mas como o admin.deleteUser() remove o registro em auth.users,
    // e a tabela public.usuarios tem uma FK com ON DELETE CASCADE, a exclusão
    // em public.usuarios deve ocorrer automaticamente.

    return new Response(
      JSON.stringify({ 
        message: `Usuário ${targetUserId.substring(0, 8)} excluído com sucesso.`,
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