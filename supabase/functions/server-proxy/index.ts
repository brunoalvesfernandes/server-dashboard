import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VPS_API_URL = Deno.env.get('VPS_API_URL');
    
    if (!VPS_API_URL) {
      throw new Error('VPS_API_URL não configurada');
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'stats';
    
    // Parse body for POST requests
    let body = null;
    if (req.method === 'POST') {
      body = await req.json();
    }

    // Forward request to VPS API
    const vpsResponse = await fetch(`${VPS_API_URL}/api/${endpoint}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const data = await vpsResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: vpsResponse.status,
    });

  } catch (error: unknown) {
    console.error('Proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        hint: 'Certifique-se que o servidor da VPS está rodando e acessível'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
