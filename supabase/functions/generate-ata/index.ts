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
      nifCondominio,
      freguesia,
      concelho,
      localReuniao,
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
Escreve atas formais, completas e profissionais seguindo a legislação portuguesa (Código Civil, artigos 1430.º a 1438.º).
A ata deve ser redigida em português europeu formal, com linguagem jurídica apropriada.

ESTRUTURA OBRIGATÓRIA DA ATA (segue este formato exatamente):

1. TÍTULO: "ATA" centrado no topo.

2. PARÁGRAFO INTRODUTÓRIO: Começa com "Aos [data por extenso], pelas [hora] horas e [minutos] minutos, reuniu no [local da reunião] em [convocatória] convocatória, a Assembleia [tipo] de Condóminos do condomínio sito na [morada], freguesia [freguesia], Concelho de [concelho], com o NIF [NIF] para deliberar sobre os assuntos seguintes:"

3. LISTA DA ORDEM DO DIA: Lista numerada com todos os pontos.

4. PARÁGRAFO SOBRE CONVOCAÇÃO: "A assembleia foi regularmente convocada por carta registada."

5. LISTA DE PRESENÇAS: Mencionar que estiveram presentes e representados X condóminos representando Y% do capital total, nos termos do art.º 1432.º do CC, o que permite deliberar sobre os assuntos constantes da ordem de trabalhos.

6. CADA PONTO DESENVOLVIDO: Com título "Ponto [número por extenso]:" seguido do desenvolvimento da deliberação. Usar linguagem como "Foi deliberado por unanimidade dos condóminos presentes...", "Foram apresentadas as contas...", etc.

7. ENCERRAMENTO: "Nada mais havendo a acrescentar, deu-se por encerrada a Assembleia cerca das [hora] horas e [minutos] minutos, sendo lavrada a presente ata que depois de lida e aprovada vai ser assinada por todos os condóminos presentes."

8. TABELA DE ASSINATURAS: Presidente e condóminos presentes.

REGRAS:
- Usa português europeu formal e jurídico.
- Não inventes dados - usa apenas a informação fornecida.
- Escreve os números por extenso quando apropriado.
- Referencia artigos do Código Civil quando relevante (art.º 1429.º para seguros, art.º 1432.º para quórum, art.º 1436.º para funções do administrador).
- Para pontos personalizados, desenvolve o texto com base nas notas fornecidas.`;

    const userPrompt = `Gera uma ata de assembleia de condomínio com os seguintes dados:

**Condomínio:** ${nomeCondominio}
**Morada:** ${morada}
**NIF:** ${nifCondominio}
**Freguesia:** ${freguesia}
**Concelho:** ${concelho}
**Local da Reunião:** ${localReuniao || "Hall de entrada"}
**Data:** ${dataAssembleia}
**Hora de Início:** ${horaInicio}
**Tipo de Assembleia:** ${tipoAssembleia === "ordinaria" ? "Ordinária" : "Extraordinária"}
**Convocatória:** ${convocatoria === "primeira" ? "1ª" : "2ª"}
**Presidente da Mesa:** ${presidenteMesa}
**Secretário:** ${secretario}
**Total de Frações:** ${totalFracoes}
**Frações Presentes:** ${fracoesPresentes}
**Frações Representadas:** ${fracoesRepresentadas}
**Percentagem de Capital Presente:** ${percentagemPresente}%

**Pontos da Ordem do Dia:**
${pontosFormatados}

${observacoesAdicionais ? `**Observações Adicionais:** ${observacoesAdicionais}` : ""}

Redige a ata completa e formal seguindo exatamente a estrutura indicada.`;

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
