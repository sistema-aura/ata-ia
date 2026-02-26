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
    } else if (parseType === "dividas") {
      prompt = `Analisa este documento de dívidas/valores em atraso de um condomínio.
Extrai a informação de todos os condóminos com valores em dívida, organizados POR ORDEM DE FRAÇÃO.

Devolve APENAS um JSON válido com esta estrutura (sem markdown, sem texto extra):
{
  "dividas": [
    {
      "fracao": "A",
      "descricao": "Parq. Nº1",
      "nome": "Nome do condómino",
      "valorDivida": "150.00",
      "detalhes": [
        {"quotizacao": "38.63", "fundoReserva": "3.86", "mesInicio": "janeiro", "mesFim": "fevereiro", "ano": "2026", "total": "84.98"},
        {"quotaExtra": "Reparação Danos", "total": "329.86"}
      ]
    }
  ],
  "totalDivida": "450.00"
}

REGRAS DE EXTRAÇÃO:
- "fracao": a letra da fração (ex: "A", "B", "M", "R")
- "descricao": a descrição da fração (ex: "Parq. Nº1", "2º Dto", "5º Recuado", "Garagem B")
- "detalhes": array com cada período em dívida. Para cada período extrair:
  - "quotizacao": valor mensal da quotização
  - "fundoReserva": valor mensal do fundo de reserva
  - "mesInicio" e "mesFim": se é um único mês, mesInicio = mesFim. Se são vários meses do mesmo ano, indica o primeiro e último.
  - "ano": o ano do período
  - "total": valor total desse período
  - Para quotas extras: usa "quotaExtra" com a descrição e "total" com o valor
- Se os meses são de anos diferentes, separa em entradas diferentes no array detalhes.
- Ordena SEMPRE por fração.
- Inclui o valor total de dívidas no campo totalDivida.`;
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
