import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      nomeCondominio,
      morada,
      dataAssembleia,
      horaInicio,
      tipoAssembleia,
      convocatoria,
      presidenteMesa,
      secretario,
      totalFracoes,
      fracoesPresentes,
      fracoesRepresentadas,
      percentagemPresente,
      pontosOrdemDia,
      observacoesAdicionais,
    } = formData;

    const pontosFormatados = pontosOrdemDia
      .map((p: any, i: number) => {
        if (p.tipo === "padrao") {
          return `Ponto ${i + 1} (padrão): ${p.titulo} - ${p.descricaoPadrao}`;
        }
        return `Ponto ${i + 1} (personalizado): ${p.titulo} - Notas do utilizador: ${p.notas || "Sem notas adicionais"}`;
      })
      .join("\n");

    const systemPrompt = `És um assistente especializado em redigir atas de assembleias de condomínios em Portugal. 
Escreve atas formais, completas e profissionais seguindo a legislação portuguesa (Código Civil, artigos 1430º a 1438º).
A ata deve ser redigida em português europeu formal, com linguagem jurídica apropriada.
Estrutura da ata:
- Cabeçalho com identificação do condomínio, data, hora e local
- Verificação de presenças e quórum
- Constituição da mesa
- Ordem do dia com todos os pontos deliberados
- Votações e deliberações
- Encerramento com hora de término
Usa numeração romana para os pontos da ordem do dia.
Não inventes dados - usa apenas a informação fornecida.`;

    const userPrompt = `Gera uma ata de assembleia de condomínio com os seguintes dados:

**Condomínio:** ${nomeCondominio}
**Morada:** ${morada}
**Data:** ${dataAssembleia}
**Hora de Início:** ${horaInicio}
**Tipo de Assembleia:** ${tipoAssembleia}
**Convocatória:** ${convocatoria}
**Presidente da Mesa:** ${presidenteMesa}
**Secretário:** ${secretario}
**Total de Frações:** ${totalFracoes}
**Frações Presentes:** ${fracoesPresentes}
**Frações Representadas:** ${fracoesRepresentadas}
**Percentagem de Capital Presente:** ${percentagemPresente}%

**Pontos da Ordem do Dia:**
${pontosFormatados}

${observacoesAdicionais ? `**Observações Adicionais:** ${observacoesAdicionais}` : ""}

Redige a ata completa e formal.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar ata" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-ata error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
