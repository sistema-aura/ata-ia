import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { fileBase64, fileType, parseType } = await req.json();
    // parseType: "ordem_dia" | "presencas"

    if (!fileBase64) throw new Error("Nenhum ficheiro enviado");

    const mimeType = fileType || "application/pdf";

    let prompt = "";
    if (parseType === "ordem_dia") {
      prompt = `Analisa este documento e extrai todos os pontos da ordem do dia.
Devolve APENAS um JSON válido com esta estrutura (sem markdown, sem texto extra):
[
  {"titulo": "Título do ponto 1"},
  {"titulo": "Título do ponto 2"}
]
Extrai todos os pontos pela ordem em que aparecem no documento.`;
    } else if (parseType === "presencas") {
      prompt = `Analisa esta folha de presenças de uma assembleia de condomínio.
Extrai a informação de todos os condóminos e organiza-os POR ORDEM DE FRAÇÃO (R/C primeiro, depois 1º, 2º, etc., e dentro de cada andar Esq antes de Dto).

Devolve APENAS um JSON válido com esta estrutura (sem markdown, sem texto extra):
{
  "presentes": [
    {"nome": "Nome", "fracao": "R/C Esq", "nif": "123456789", "permilagem": "50.0000", "representado": false}
  ],
  "ausentes": [
    {"nome": "Nome", "fracao": "1º Dto", "nif": "987654321", "permilagem": "75.0000"}
  ],
  "totalPermilagem": "100.0000"
}

Se algum campo não for legível, coloca "ilegível". 
Ordena SEMPRE por fração (andar e lado), nunca por ordem alfabética.
Se houver condóminos representados, marca representado: true.`;
    } else {
      throw new Error("parseType inválido");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${fileBase64}` },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI parse error:", response.status, t);
      throw new Error("Erro ao analisar o documento");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
