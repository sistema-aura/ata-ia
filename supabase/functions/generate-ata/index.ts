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
      totalFracoes,
      fracoesPresentes,
      fracoesRepresentadas,
      percentagemPresente,
      presencasData,
      pontosOrdemDia,
      observacoesAdicionais,
      dividasData,
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

FORMATO OBRIGATÓRIO (segue este formato EXATAMENTE como um documento legal):

# ATA

Aos [data por extenso], pelas [hora] horas e [minutos] minutos, reuniu no [local da reunião], em [convocatória] convocatória, a Assembleia [Ordinária/Extraordinária] de Condóminos do condomínio sito na [morada], freguesia de [freguesia], Concelho de [concelho], com o NIF [NIF], para deliberar sobre os seguintes assuntos constantes da Ordem de Trabalhos:

**ORDEM DE TRABALHOS:**

1. [Ponto 1]
2. [Ponto 2]
(etc.)

---

A assembleia foi regularmente convocada por carta registada com aviso de receção enviada a todos os condóminos.

---

**PRESENÇAS:**

Verificou-se estarem presentes e/ou representados os seguintes condóminos, por ordem de fração:

**Presentes:**
- Fração [X] – [Nome], NIF [NIF], representando [permilagem]‰ do capital total
(listar todos por ordem de fração)

**Representados:**
- Fração [X] – [Nome], NIF [NIF], representando [permilagem]‰ do capital total (representado por [representante])
(se existirem)

**Ausentes:**
- Fração [X] – [Nome], NIF [NIF], representando [permilagem]‰ do capital total
(listar todos por ordem de fração)

Estiveram assim presentes e representados condóminos representando [percentagem]% do capital investido, nos termos do art.º 1432.º do Código Civil, o que permite deliberar validamente sobre os assuntos constantes da ordem de trabalhos.

O Presidente da Mesa da Assembleia foi [nome do presidente].

---

**DELIBERAÇÕES:**

**Ponto Um – [Título do ponto]**

[Desenvolvimento completo da deliberação. Usar "Foi deliberado por unanimidade dos condóminos presentes...", "Foram apresentadas e aprovadas...", etc.]

**Ponto Dois – [Título do ponto]**

[Desenvolvimento...]

(continuar para todos os pontos, usando números por extenso: Um, Dois, Três, Quatro, Cinco, Seis, Sete...)

---

**ENCERRAMENTO**

Nada mais havendo a tratar, deu-se por encerrada a Assembleia cerca das [hora] horas e [minutos] minutos, sendo lavrada a presente ata que, depois de lida e aprovada, vai ser assinada pelo Presidente da Mesa e pelos condóminos presentes.

---

**ASSINATURAS**

| Fração | Nome | Assinatura |
|--------|------|------------|
| | Presidente da Mesa: [nome] | _________________ |
| [Fração] | [Nome] | _________________ |
(listar todos os presentes por ordem de fração)

REGRAS IMPORTANTES:
- Usa SEMPRE português europeu formal e jurídico.
- NÃO inventes dados — usa apenas a informação fornecida.
- Escreve os números dos pontos POR EXTENSO (Ponto Um, Ponto Dois, etc.).
- Referencia artigos do Código Civil: art.º 1429.º (seguros), art.º 1432.º (quórum), art.º 1436.º (administrador).
- Para pontos padrão, usa a descrição fornecida como base.
- Para pontos personalizados, desenvolve o texto com base nas notas fornecidas.
- Ordena SEMPRE os condóminos por fração (R/C, 1º, 2º, 3º, etc.), NUNCA por ordem alfabética.
- Usa formatação markdown com cabeçalhos, negrito, linhas horizontais e tabelas.`;

    // Format presencas if available
    let presencasFormatadas = "";
    if (presencasData) {
      const formatCondomino = (c: any) =>
        `${c.nome}, proprietário(a) da Fração ${c.fracao}, com o NIF ${c.nif} representando ${c.permilagem}‰ do capital total do edifício${c.representado ? " (representado)" : ""}`;

      if (presencasData.presentes?.length) {
        presencasFormatadas += `\n**Condóminos Presentes (por ordem de fração):**\n${presencasData.presentes.map(formatCondomino).join("\n")}`;
      }
      if (presencasData.ausentes?.length) {
        presencasFormatadas += `\n\n**Condóminos Ausentes:**\n${presencasData.ausentes.map(formatCondomino).join("\n")}`;
      }
    }

    // Format dividas if available
    let dividasFormatadas = "";
    if (dividasData?.dividas?.length) {
      dividasFormatadas = `\n**Valores em Dívida ao Condomínio (por ordem de fração):**\n` +
        dividasData.dividas.map((d: any) =>
          `- Fração ${d.fracao} (${d.nome}): ${d.valorDivida}€${d.mesesAtraso ? ` — ${d.mesesAtraso} meses em atraso` : ""}${d.observacoes ? ` (${d.observacoes})` : ""}`
        ).join("\n") +
        `\n**Total em dívida:** ${dividasData.totalDivida}€`;
    }

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
**Total de Frações:** ${totalFracoes}
**Frações Presentes:** ${fracoesPresentes}
**Frações Representadas:** ${fracoesRepresentadas}
**Percentagem de Capital Presente:** ${percentagemPresente}%
${presencasFormatadas}

**Pontos da Ordem do Dia:**
${pontosFormatados}
${dividasFormatadas}

${observacoesAdicionais ? `**Observações Adicionais:** ${observacoesAdicionais}` : ""}

Redige a ata completa e formal seguindo exatamente a estrutura indicada. Lista os condóminos presentes e ausentes por ordem de fração. No ponto sobre dívidas, inclui a tabela detalhada de valores em dívida por fração.`;

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
