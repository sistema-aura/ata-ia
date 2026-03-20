import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CompanyFormattingTexts {
  opening_paragraph_template?: string;
  agenda_item_template?: string;
  attendance_intro_text?: string;
  attendance_item_template?: string;
  absentees_intro_text?: string;
  absentee_item_template?: string;
  legal_opening_text?: string;
  point_paragraph_template?: string;
  closing_text?: string;
  signatures_title?: string;
  signature_item_template?: string;
  debt_section_intro_text?: string;
  debt_total_label?: string;
  debt_quota_extra_label?: string;
  debt_header_template?: string;
  debt_detail_template?: string;
}

const DEFAULT_COMPANY_TEXTS: Required<CompanyFormattingTexts> = {
  opening_paragraph_template:
    "Aos [data por extenso], pelas [hora] horas, reuniu no [local] em [convocatória] convocatória, a Assembleia [Ordinária/Extraordinária] de Condóminos do condomínio sito na [morada], concelho de [concelho] com o NIPC [NIF], para deliberar sobre os assuntos seguintes:",
  agenda_item_template: "[numero]. [titulo];",
  attendance_intro_text:
    "A assembleia foi regularmente convocada por carta registada. Estiveram presentes e representados os seguintes condóminos:",
  attendance_item_template:
    "• [Nome completo], proprietário da fração [X], correspondente ao [descrição], representando [permilagem] % do capital total do edifício;",
  absentees_intro_text: "Estiveram ausentes os seguintes condóminos:",
  absentee_item_template:
    "• [Nome completo], proprietário da fração [X], correspondente ao [descrição], representando [permilagem] % do capital total do edifício;",
  legal_opening_text:
    "Os condóminos presentes representam [SOMA das permilagens dos presentes]‰ da permilagem total do imóvel, correspondentes a [percentagem] % do Capital Total do Edifício, nos termos do art.º 1432.º, do CC, o que permite deliberar sobre os assuntos constantes da ordem de trabalhos. Exerceu as funções de presidente o Sr. [nome presidente].",
  point_paragraph_template: "Ponto [número por extenso]: [Título]- [Texto da deliberação]",
  closing_text:
    "Nada mais havendo a acrescentar, deu-se por encerrada a Assembleia cerca das [hora] horas e [minutos] minutos, sendo lavrada a presente ata que depois de lida e aprovada vai ser assinada por todos os condóminos presentes.",
  signatures_title: "Presidente:",
  signature_item_template:
    "[Descrição fração]: ____________________________________________________________",
  debt_section_intro_text: "DÍVIDAS AO CONDOMÍNIO (COPIAR TAL QUAL PARA A ATA):",
  debt_total_label: "Total geral em dívida ao condomínio:",
  debt_quota_extra_label: "Quota extra",
  debt_header_template:
    "✓ Fração [X] – [Descrição] – [Valor por extenso] (€ [valor numérico]) correspondentes:",
  debt_detail_template:
    "o  a quotização (€ ____) e fundo de reserva (€ ____) do mês de [mês início] até ao mês de [mês fim] do ano [ano] (€ ____);",
};

const getText = <K extends keyof CompanyFormattingTexts>(
  companyFormatting: CompanyFormattingTexts,
  key: K,
) => companyFormatting[key]?.trim() || DEFAULT_COMPANY_TEXTS[key];

function buildSystemPrompt(companyFormatting: CompanyFormattingTexts = {}) {
  const openingParagraph = getText(companyFormatting, "opening_paragraph_template");
  const agendaItemTemplate = getText(companyFormatting, "agenda_item_template");
  const attendanceIntro = getText(companyFormatting, "attendance_intro_text");
  const attendanceItemTemplate = getText(companyFormatting, "attendance_item_template");
  const absenteesIntro = getText(companyFormatting, "absentees_intro_text");
  const absenteeItemTemplate = getText(companyFormatting, "absentee_item_template");
  const legalOpening = getText(companyFormatting, "legal_opening_text");
  const pointParagraphTemplate = getText(companyFormatting, "point_paragraph_template");
  const closingText = getText(companyFormatting, "closing_text");
  const signaturesTitle = getText(companyFormatting, "signatures_title");
  const signatureItemTemplate = getText(companyFormatting, "signature_item_template");
  const debtSectionIntro = getText(companyFormatting, "debt_section_intro_text");
  const debtTotalLabel = getText(companyFormatting, "debt_total_label");
  const debtQuotaExtraLabel = getText(companyFormatting, "debt_quota_extra_label");
  const debtHeaderTemplate = getText(companyFormatting, "debt_header_template");
  const debtDetailTemplate = getText(companyFormatting, "debt_detail_template");

  return `És um assistente especializado em redigir atas de assembleias de condomínios em Portugal.
A ata deve ser redigida em português europeu formal. NÃO uses markdown (sem #, **, ---, etc.). Escreve texto corrido simples.

FORMATO OBRIGATÓRIO — segue este modelo EXATAMENTE, respeitando os templates desta empresa:

ATA NÚMERO [número]

${openingParagraph}

Template de cada item da ordem de trabalhos:
${agendaItemTemplate}

${attendanceIntro}

Template de cada presente:
${attendanceItemTemplate}

${absenteesIntro}

Template de cada ausente:
${absenteeItemTemplate}

${legalOpening}
IMPORTANTE: O valor em ‰ (permilagem) DEVE ser a SOMA ARITMÉTICA das permilagens individuais de todos os condóminos presentes listados acima. Calcula a soma e usa esse valor.

Template de cada ponto deliberado:
${pointParagraphTemplate}

${closingText}

${signaturesTitle} _____________________________________________________________

Template de cada linha de assinatura das frações presentes:
${signatureItemTemplate}

REGRAS OBRIGATÓRIAS:
- NÃO uses markdown. Sem #, ##, **, ***, ---, etc. Texto corrido simples.
- NÃO uses "negrito". Escreve tudo em texto normal.
- NÃO inventes dados — usa apenas a informação fornecida.
- Condóminos SEMPRE por ordem de fração.
- Todas as permilagens devem ser apresentadas com 4 casas decimais e vírgula decimal, por exemplo: 98,0000‰.
- Os textos configurados desta empresa devem ser respeitados exatamente, adaptando apenas os placeholders entre [ ].
- Se o template usar placeholders como [numero], [titulo], [Nome completo], [Descrição fração], [valor numérico], [ano], tens de os preencher com os dados corretos.
- Se o template tiver pontuação própria, mantém essa pontuação.

TEXTOS FIXOS OBRIGATÓRIOS (quando o ponto é marcado como "padrão", usa o texto fornecido na descricaoPadrao TAL QUAL, sem alterar nem resumir):
- Para o ponto de APRESENTAÇÃO DAS CONTAS, usa o texto padrão fornecido. Se tiver notas adicionais com valores de saldo, preenche os espaços em branco.
- Para o ponto de ELEIÇÃO DA ADMINISTRAÇÃO, usa SEMPRE o texto padrão fornecido pelo utilizador sem alterar conteúdo base, preenchendo apenas espaços em branco quando existirem notas.
- Para o ponto de ORÇAMENTO PREVISIONAL, usa o texto padrão fornecido. Se tiver notas adicionais com valores, preenche os espaços em branco.
- Para o ponto de PENALIZAÇÃO/COBRANÇA JUDICIAL, usa o texto padrão fornecido TAL QUAL, sem modificar nenhuma palavra.
- Para o ponto de ATUALIZAÇÃO DOS VALORES EM DÍVIDA, usa o texto padrão fornecido como introdução, seguido da lista de dívidas EXATAMENTE como fornecida nos dados.

Texto de introdução da secção de dívidas a usar: ${debtSectionIntro}
Texto do total final da secção de dívidas a usar: ${debtTotalLabel}
Texto da linha de quota extra a usar: ${debtQuotaExtraLabel}
Template do cabeçalho da dívida: ${debtHeaderTemplate}
Template da linha de detalhe da dívida: ${debtDetailTemplate}

FORMATO DAS DÍVIDAS:
- Copia a secção de dívidas tal como é fornecida nos dados do utilizador, respeitando os templates da empresa.
- Mantém os "____" quando vierem nos dados.
- Cada ano diferente fica numa linha "o" separada.
- Cada quota extra fica numa linha "o" separada.
- Nunca juntes anos diferentes na mesma linha.
- Não uses tabelas.`;
}

function stripFracaoPrefix(fracao: string, descricao: string): string {
  if (!descricao) return fracao;
  // Remove prefix like "H - " or "A - " from description to keep only the floor/unit part
  const stripped = descricao.replace(/^[A-Za-z0-9]+\s*[-–]\s*/, "").trim();
  return stripped || descricao;
}

function splitFracao(fracao: string): { code: string; desc: string } {
  // Split "0-C - R/C C" into code "0-C" and description "R/C C"
  // Match the first part (fraction code) separated by " - " from the description
  const match = fracao.match(/^(\S+)\s*[-–]\s*(.+)$/);
  if (match) {
    return { code: match[1], desc: match[2].trim() };
  }
  return { code: fracao, desc: fracao };
}

function formatPresencas(presencasData: any): string {
  if (!presencasData) return "";
  const fmt = (c: any) => {
    const { code, desc } = splitFracao(c.fracao);
    const nifPart = c.nif ? `, com NIF ${c.nif},` : ",";
    return `${c.nome}${nifPart} proprietário da fração ${code}, correspondente ao ${desc}, representando ${c.permilagem} ‰ do capital total do edifício${c.representado ? " (representado)" : ""}`;
  };

  let result = "";
  if (presencasData.presentes?.length) {
    result += `\nCondóminos Presentes (por ordem de fração):\n${presencasData.presentes.map((c: any) => `• ${fmt(c)}`).join("\n")}`;
  }
  if (presencasData.ausentes?.length) {
    result += `\n\nCondóminos Ausentes (por ordem de fração):\n${presencasData.ausentes.map((c: any) => `• ${fmt(c)}`).join("\n")}`;
  }
  return result;
}

function parseObservacoesToPeriods(obs: string): string[] {
  const monthMap: Record<string, string> = {
    jan: "janeiro",
    fev: "fevereiro",
    mar: "março",
    abr: "abril",
    mai: "maio",
    maio: "maio",
    jun: "junho",
    jul: "julho",
    ago: "agosto",
    set: "setembro",
    out: "outubro",
    oct: "outubro",
    nov: "novembro",
    dez: "dezembro",
    dec: "dezembro",
    feb: "fevereiro",
    apr: "abril",
    aug: "agosto",
    sep: "setembro",
  };
  const toMonth = (s: string) => monthMap[s.toLowerCase()] || s.toLowerCase();

  const match = obs?.match(/([A-Za-zç]+)\/(\d{4})\s*-\s*([A-Za-zç]+)\/(\d{4})/);
  if (!match) return [];

  const [, m1, y1, m2, y2] = match;
  const startYear = parseInt(y1);
  const endYear = parseInt(y2);

  const allMonths = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const startIdx = allMonths.indexOf(toMonth(m1));
  const endIdx = allMonths.indexOf(toMonth(m2));

  if (startIdx === -1 || endIdx === -1) return [];

  const lines: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const from = year === startYear ? allMonths[startIdx] : "janeiro";
    const to = year === endYear ? allMonths[endIdx] : "dezembro";
    const meses =
      from === to
        ? `do mês de ${from} do ano ${year}`
        : `do mês de ${from} até ao mês de ${to} do ano ${year}`;
    lines.push(`o  a quotização (€ ____) e fundo de reserva (€ ____) ${meses} (€ ____);`);
  }
  return lines;
}

function formatDividas(
  dividasData: any,
  companyFormatting: CompanyFormattingTexts = {},
): string {
  if (!dividasData?.dividas?.length) return "";

  const debtSectionIntro = getText(companyFormatting, "debt_section_intro_text");
  const debtTotalLabel = getText(companyFormatting, "debt_total_label");
  const debtQuotaExtraLabel = getText(companyFormatting, "debt_quota_extra_label");
  const debtHeaderTemplate = getText(companyFormatting, "debt_header_template");
  const debtDetailTemplate = getText(companyFormatting, "debt_detail_template");

  const formatHeader = (d: any) =>
    debtHeaderTemplate
      .replaceAll("[X]", d.fracao || "")
      .replaceAll("[Descrição]", d.descricao || d.fracao || "")
      .replaceAll("[Valor por extenso]", `[VALOR POR EXTENSO de ${d.valorDivida}€]`)
      .replaceAll("[valor numérico]", d.valorDivida || "");

  const formatDetalhe = (det: any): string => {
    if (det.quotaExtra) {
      const totalVal = det.total || "____";
      return `o  ${debtQuotaExtraLabel} ${det.quotaExtra} (€ ${totalVal});`;
    }

    const singleMonth = det.mesInicio === det.mesFim;
    const fromText = singleMonth
      ? `do mês de ${det.mesInicio} do ano ${det.ano}`
      : `do mês de ${det.mesInicio} até ao mês de ${det.mesFim} do ano ${det.ano}`;

    return debtDetailTemplate
      .replaceAll("[mês]", det.mesInicio || "")
      .replaceAll("[mês início]", det.mesInicio || "")
      .replaceAll("[mês fim]", det.mesFim || det.mesInicio || "")
      .replaceAll("[ano]", det.ano || "")
      .replaceAll("[periodo]", fromText)
      .replaceAll("(€ ____)", `(€ ${det.total || "____"})`)
      .replace("quotização (€ ____)", `quotização (€ ${det.quotizacao || "____"})`)
      .replace("fundo de reserva (€ ____)", `fundo de reserva (€ ${det.fundoReserva && det.fundoReserva !== "__" ? det.fundoReserva : "____"})`);
  };

  return (
    `\n\n${debtSectionIntro}\n` +
    dividasData.dividas
      .map((d: any) => {
        const header = formatHeader(d);
        if (d.detalhes?.length) {
          return header + "\n" + d.detalhes.map(formatDetalhe).join("\n");
        }
        if (d.observacoes) {
          const periodLines = parseObservacoesToPeriods(d.observacoes);
          if (periodLines.length) {
            return header + "\n" + periodLines.join("\n");
          }
        }
        return header;
      })
      .join("\n") +
    `\n${debtTotalLabel} ${dividasData.totalDivida}€`
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      numeroAta,
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

    let customInstructions = "";
    let companyFormatting: CompanyFormattingTexts = {};

    if (formData.companyId) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const fmtResp = await fetch(
            `${SUPABASE_URL}/rest/v1/company_formatting?company_id=eq.${formData.companyId}&select=ai_custom_instructions,opening_paragraph_template,agenda_item_template,attendance_intro_text,attendance_item_template,absentees_intro_text,absentee_item_template,legal_opening_text,point_paragraph_template,closing_text,signatures_title,signature_item_template,debt_section_intro_text,debt_total_label,debt_quota_extra_label,debt_header_template,debt_detail_template`,
            {
              headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
            },
          );
          if (fmtResp.ok) {
            const fmtData = await fmtResp.json();
            if (fmtData?.[0]) {
              customInstructions = fmtData[0].ai_custom_instructions || "";
              companyFormatting = {
                opening_paragraph_template: fmtData[0].opening_paragraph_template,
                agenda_item_template: fmtData[0].agenda_item_template,
                attendance_intro_text: fmtData[0].attendance_intro_text,
                attendance_item_template: fmtData[0].attendance_item_template,
                absentees_intro_text: fmtData[0].absentees_intro_text,
                absentee_item_template: fmtData[0].absentee_item_template,
                legal_opening_text: fmtData[0].legal_opening_text,
                point_paragraph_template: fmtData[0].point_paragraph_template,
                closing_text: fmtData[0].closing_text,
                signatures_title: fmtData[0].signatures_title,
                signature_item_template: fmtData[0].signature_item_template,
                debt_section_intro_text: fmtData[0].debt_section_intro_text,
                debt_total_label: fmtData[0].debt_total_label,
                debt_quota_extra_label: fmtData[0].debt_quota_extra_label,
                debt_header_template: fmtData[0].debt_header_template,
                debt_detail_template: fmtData[0].debt_detail_template,
              };
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch formatting config:", e);
      }
    }

    const pontosFormatados = pontosOrdemDia
      .map((p: any, i: number) => {
        if (p.tipo === "padrao") {
          return `Ponto ${i + 1} (padrão): ${p.titulo} - ${p.descricaoPadrao}${p.notas ? ` | Notas adicionais: ${p.notas}` : ""}`;
        }
        return `Ponto ${i + 1} (personalizado): ${p.titulo} - Notas: ${p.notas || "Sem notas"}`;
      })
      .join("\n");

    let systemPrompt = buildSystemPrompt(companyFormatting);
    if (customInstructions) {
      systemPrompt += `\n\nINSTRUÇÕES ADICIONAIS ESPECÍFICAS DESTA EMPRESA (seguir obrigatoriamente):\n${customInstructions}`;
    }

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

Pontos da Ordem de Trabalhos:
${pontosFormatados}
${formatDividas(dividasData, companyFormatting)}

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Limite de pedidos excedido. Tente novamente em alguns segundos.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});