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
      prompt = `Analisa este documento e extrai todos os pontos da ordem de trabalhos.
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
    {"nome": "Nome", "fracao": "R/C Esq", "nif": "123456789", "permilagem": "50,0000", "representado": false}
  ],
  "ausentes": [
    {"nome": "Nome", "fracao": "1º Dto", "nif": "987654321", "permilagem": "75,0000"}
  ],
  "totalPermilagem": "1000,0000"
}

REGRAS DAS PERMILAGENS:
- Usa SEMPRE 4 casas decimais.
- Usa vírgula como separador decimal.
- Exemplo correto: "98,0000".

Se algum campo não for legível, coloca "ilegível". 
Ordena SEMPRE por fração (andar e lado), nunca por ordem alfabética.
Se houver condóminos representados, marca representado: true.`;
    } else if (parseType === "dividas") {
      prompt = `Analisa este documento de dívidas/valores em atraso de um condomínio.
Extrai a informação de todos os condóminos com valores em dívida, organizados POR ORDEM DE FRAÇÃO.

IMPORTANTE: Tens de extrair os valores REAIS de quotização e fundo de reserva que constam no documento. NÃO deixes em branco. Se o documento mostra o valor mensal de quota e fundo de reserva, usa esses valores. Se mostra apenas o total de um período, calcula o valor mensal dividindo pelo número de meses.

Devolve APENAS um JSON válido com esta estrutura (sem markdown, sem texto extra):
{
  "dividas": [
    {
      "fracao": "A",
      "descricao": "R/ch Esq.",
      "nome": "Nome do condómino",
      "valorDivida": "530.24",
      "detalhes": [
        {"quotizacao": "28.05", "fundoReserva": "2.81", "mesInicio": "outubro", "mesFim": "dezembro", "ano": "2024", "total": "92.58"},
        {"quotizacao": "28.05", "fundoReserva": "2.81", "mesInicio": "janeiro", "mesFim": "dezembro", "ano": "2025", "total": "370.32"},
        {"quotizacao": "30.61", "fundoReserva": "3.06", "mesInicio": "janeiro", "mesFim": "fevereiro", "ano": "2026", "total": "67.34"},
        {"quotaExtra": "Reparação Danos 5º Recuado", "total": "329.86"}
      ]
    }
  ],
  "totalDivida": "530.24"
}

REGRAS DE EXTRAÇÃO:
- "fracao": a letra ou descrição curta da fração (ex: "A", "B", "M", "R")
- "descricao": a descrição da fração (ex: "Parq. Nº1", "2º Dto", "5º Recuado", "R/ch Esq.")
- "detalhes": array com cada período em dívida, SEPARADO POR ANO. Cada entrada deve ter:
  - "quotizacao": valor MENSAL da quotização (valor REAL do documento, NUNCA em branco)
  - "fundoReserva": valor MENSAL do fundo de reserva (valor REAL do documento, NUNCA em branco)
  - "mesInicio" e "mesFim": primeiro e último mês do período. Se é um único mês, mesInicio = mesFim.
  - "ano": o ano do período
  - "total": valor total desse período (quotização + fundo de reserva multiplicados pelo nº de meses)
  - Para quotas extras: usa "quotaExtra" com a descrição e "total" com o valor
- OBRIGATÓRIO: Separar SEMPRE por ano diferente. Meses de 2024, 2025 e 2026 ficam em linhas separadas.
- Ordena SEMPRE por fração.
- Inclui o valor total de dívidas no campo totalDivida.
- NUNCA deixes quotizacao ou fundoReserva vazios ou com "__". Extrai os valores do documento.`;
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
