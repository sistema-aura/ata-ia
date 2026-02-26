import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt() {
  return `És um assistente especializado em redigir atas de assembleias de condomínios em Portugal.
A ata deve ser redigida em português europeu formal. NÃO uses markdown (sem #, **, ---, etc.). Escreve texto corrido simples.

FORMATO OBRIGATÓRIO — segue este modelo EXATAMENTE:

ATA NÚMERO [número]

Aos [data por extenso], pelas [hora] horas, reuniu no [local] em [convocatória] convocatória, a Assembleia [Ordinária/Extraordinária] de Condóminos do condomínio sito na [morada], concelho de [concelho] com o NIPC [NIF], para deliberar sobre os assuntos seguintes:

1. [Ponto 1];
2. [Ponto 2];
(lista numerada simples com ponto e vírgula no fim de cada)

A assembleia foi regularmente convocada por carta registada. Estiveram presentes e representados os seguintes condóminos:

• [Nome completo], proprietário da fração [X], correspondente ao [descrição], representando [permilagem] % do capital total do edifício;
• [Nome completo], proprietário da fração [Y], correspondente ao [descrição], representando [permilagem] % do capital total do edifício;
(listar TODOS os presentes por ordem de fração, com bullet point •, nome primeiro)

Estiveram ausentes os seguintes condóminos:

• [Nome completo], proprietário da fração [X], correspondente ao [descrição], representando [permilagem] % do capital total do edifício;
(MESMO formato que os presentes, com bullet point •)

Os condóminos presentes representam [SOMA das permilagens dos presentes]‰ da permilagem total do imóvel, correspondentes a [percentagem] % do Capital Total do Edifício, nos termos do art.º 1432.º, do CC, o que permite deliberar sobre os assuntos constantes da ordem de trabalhos. Exerceu as funções de presidente o Sr. [nome presidente].
IMPORTANTE: O valor em ‰ (permilagem) DEVE ser a SOMA ARITMÉTICA das permilagens individuais de todos os condóminos presentes listados acima. Calcula a soma e usa esse valor.

Ponto Um: [Título do ponto]- [Texto da deliberação]

Ponto Dois: [Título do ponto]- [Texto da deliberação]

(continuar para todos os pontos, números POR EXTENSO: Um, Dois, Três, Quatro, Cinco, Seis, Sete, Oito, Nove, Dez)

Nada mais havendo a acrescentar, deu-se por encerrada a Assembleia cerca das [hora] horas e [minutos] minutos, sendo lavrada a presente ata que depois de lida e aprovada vai ser assinada por todos os condóminos presentes.

Presidente: _____________________________________________________________

[Descrição fração 1]: ____________________________________________________________

[Descrição fração 2]: ____________________________________________________________

(listar as descrições das frações dos PRESENTES por ordem, NÃO a letra da fração mas sim a descrição como "Garagem A", "Cave Esq", "1º Esq", "4º Dto", etc.)

REGRAS OBRIGATÓRIAS:
- NÃO uses markdown. Sem #, ##, **, ***, ---, etc. Texto corrido simples.
- NÃO uses "negrito". Escreve tudo em texto normal.
- NÃO inventes dados — usa apenas a informação fornecida.
- Números dos pontos SEMPRE por extenso (Ponto Um, Ponto Dois).
- Formato do ponto: "Ponto Um: [Título]- [Texto]" (sem mudança de linha entre título e texto).
- Condóminos SEMPRE por ordem de fração.
- Presentes e ausentes EXATAMENTE no mesmo formato com bullet •.
- As assinaturas usam a DESCRIÇÃO da fração (ex: "Garagem A:", "Cave Esq:", "1º Dto:"), NÃO a letra.

TEXTOS FIXOS OBRIGATÓRIOS:

Para o ponto de SEGURO DAS FRAÇÕES, usa SEMPRE:
"Seguro das frações – Neste ponto os condóminos foram informados que de acordo com a legislação da propriedade horizontal, Art.º 1429º o seguro das frações é obrigatório. Como tal é necessário que seja entregue a Administração uma cópia devidamente atualizada do respetivo RECIBO DE PRÉMIO do seguro."

Para o ponto de PENALIZAÇÃO/COBRANÇA JUDICIAL, usa SEMPRE:
"O Condómino que não proceder ao pagamento da sua quota-parte nas despesas e encargos dentro do prazo fixado (180 dias) pela Assembleia de Condóminos, será sujeito à aplicação de uma multa pelo atraso no pagamento do valor correspondente a 10% do valor em cobrança, sempre em respeito pelo limite legal previsto no n.º 2 do artigo 1434.º do Código Civil (no valor 400,00 €) Serão suportadas pelo condómino em causa, todas as despesas judiciais e extrajudiciais custeadas ( no valor mínimo de 750,00 € + iva) pelo Condomínio para cobrança coerciva dos valores em dívida, incluindo honorários de advogado, solicitador ou agente de execução e custas judiciais presentes e futuros"

FORMATO DAS DÍVIDAS (no ponto de atualização dos valores em dívida):
Usa EXATAMENTE este formato com os marcadores ü e o:

ü Fração [X] – [Descrição] – [Valor por extenso] (€ [valor total]) correspondentes:
o  a quotização (€ [valor]) e fundo de reserva (€ [valor]) do mês de [mês início] até ao mês de [mês fim] do ano [ano] (€ [valor total desse período]);

REGRAS DE AGRUPAMENTO:
- Se os meses em dívida são do MESMO ANO, agrupa-os numa única linha "o": "do mês de janeiro até ao mês de fevereiro do ano 2026 (€ total);"
- Se os meses são de ANOS DIFERENTES, separa em linhas "o" diferentes, uma por cada ano.
- Cada quota extra fica numa linha "o" separada.

Exemplo com mesmo ano:
ü Fração A – Parq. Nº1 – Sete euros e quatro cêntimos (€ 7,04) correspondentes:
o  a quotização (€ 0,73) e fundo de reserva (€ 2,79) do mês de janeiro até ao mês de fevereiro do ano 2026 (€ 7,04);

Exemplo com anos diferentes e quota extra:
ü Fração M – 2º Dto – Oitenta e quatro euros e oitenta e seis cêntimos (€ 84,86) correspondentes:
o  a quotização (€ 38,63) e fundo de reserva (€ 3,86) do mês de dezembro do ano 2025 (€ 42,49);
o  a quotização (€ 38,63) e fundo de reserva (€ 3,86) do mês de janeiro do ano 2026 (€ 42,49);

Exemplo com quota extra:
ü Fração B – Garagem B – Trezentos e trinta e nove euros e oitenta e quatro cêntimos (€ 339,84) correspondentes:
o  Quota extra Reparação Danos 5º Recuado (€ 329,86);
o  a quotização (€ 9,07) e fundo de reserva (€ 0,91) do mês de janeiro do ano 2026 (€ 9,98);

NÃO uses tabelas. NÃO uses markdown. Texto corrido com marcadores ü e o.`;
}

function formatPresencas(presencasData: any): string {
  if (!presencasData) return "";
  const fmt = (c: any) =>
    `${c.nome}, proprietário da fração ${c.fracao}, correspondente ao ${c.descricao || c.fracao}, representando ${c.permilagem} % do capital total do edifício${c.representado ? " (representado)" : ""}`;

  let result = "";
  if (presencasData.presentes?.length) {
    result += `\nCondóminos Presentes (por ordem de fração):\n${presencasData.presentes.map((c: any) => `• ${fmt(c)}`).join("\n")}`;
  }
  if (presencasData.ausentes?.length) {
    result += `\n\nCondóminos Ausentes (por ordem de fração):\n${presencasData.ausentes.map((c: any) => `• ${fmt(c)}`).join("\n")}`;
  }
  return result;
}

function formatDividas(dividasData: any): string {
  if (!dividasData?.dividas?.length) return "";
  return `\nValores em Dívida ao Condomínio (por ordem de fração):\n` +
    dividasData.dividas.map((d: any) =>
      `ü Fração ${d.fracao} – ${d.nome} – valor em dívida de ${d.valorDivida}€${d.mesesAtraso ? `, correspondente a ${d.mesesAtraso} meses em atraso` : ""}${d.observacoes ? `. Observações: ${d.observacoes}` : ""}`
    ).join("\n") +
    `\nTotal geral em dívida ao condomínio: ${dividasData.totalDivida}€` +
    `\n\nIMPORTANTE: Formata as dívidas com o marcador ü para cada fração e o para os detalhes de quotização/fundo de reserva, conforme o formato obrigatório no system prompt.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      numeroAta, nomeCondominio, morada, nifCondominio, freguesia, concelho,
      localReuniao, dataAssembleia, horaInicio, tipoAssembleia,
      convocatoria, presidenteMesa, totalFracoes, fracoesPresentes,
      fracoesRepresentadas, percentagemPresente, presencasData,
      pontosOrdemDia, observacoesAdicionais, dividasData,
    } = formData;

    const pontosFormatados = pontosOrdemDia
      .map((p: any, i: number) => {
        if (p.tipo === "padrao") {
          return `Ponto ${i + 1} (padrão): ${p.titulo} - ${p.descricaoPadrao}${p.notas ? ` | Notas adicionais: ${p.notas}` : ""}`;
        }
        return `Ponto ${i + 1} (personalizado): ${p.titulo} - Notas: ${p.notas || "Sem notas"}`;
      })
      .join("\n");

    const userPrompt = `Gera uma ata de assembleia de condomínio com os seguintes dados:

Número da Ata: ${numeroAta || ""}
Condomínio: ${nomeCondominio}
Morada: ${morada}
NIF: ${nifCondominio}
Freguesia: ${freguesia}
Concelho: ${concelho}
Local da Reunião: ${localReuniao || "Hall de entrada"}
Data: ${dataAssembleia}
Hora de Início: ${horaInicio}
Tipo de Assembleia: ${tipoAssembleia === "ordinaria" ? "Ordinária" : "Extraordinária"}
Convocatória: ${convocatoria === "primeira" ? "1ª" : "2ª"}
Presidente da Mesa: ${presidenteMesa}
Total de Frações: ${totalFracoes}
Frações Presentes: ${fracoesPresentes}
Frações Representadas: ${fracoesRepresentadas}
Percentagem de Capital Presente: ${percentagemPresente}%
${formatPresencas(presencasData)}

Pontos da Ordem do Dia:
${pontosFormatados}
${formatDividas(dividasData)}

${observacoesAdicionais ? `Observações Adicionais: ${observacoesAdicionais}` : ""}

Redige a ata completa seguindo EXATAMENTE o formato do system prompt. SEM markdown. Texto corrido simples.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar ata" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-ata error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
