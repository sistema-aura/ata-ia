import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Helpers: Numbers & Dates to Portuguese words ───────────────────────────

const UNITS = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const TEENS = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezasseis", "dezassete", "dezoito", "dezanove"];
const TENS = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function numberToWords(n: number): string {
  if (n === 0) return "zero";
  if (n === 100) return "cem";
  if (n < 0) return "menos " + numberToWords(-n);

  const parts: string[] = [];

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    parts.push(millions === 1 ? "um milhão" : numberToWords(millions) + " milhões");
    n %= 1000000;
    if (n > 0) parts.push("e");
  }

  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    parts.push(thousands === 1 ? "mil" : numberToWords(thousands) + " mil");
    n %= 1000;
    if (n > 0 && n < 100) parts.push("e");
    else if (n >= 100) parts.push("e");
  }

  if (n >= 100) {
    if (n === 100) {
      parts.push("cem");
      return parts.join(" ");
    }
    parts.push(HUNDREDS[Math.floor(n / 100)]);
    n %= 100;
    if (n > 0) parts.push("e");
  }

  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)]);
    n %= 10;
    if (n > 0) parts.push("e " + UNITS[n]);
  } else if (n >= 10) {
    parts.push(TEENS[n - 10]);
  } else if (n > 0) {
    parts.push(UNITS[n]);
  }

  return parts.join(" ");
}

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dateToWords(dateStr: string): string {
  // Expects "YYYY-MM-DD" or "DD/MM/YYYY"
  let day: number, month: number, year: number;
  if (dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-").map(Number);
    day = d; month = m; year = y;
  } else {
    const [d, m, y] = dateStr.split("/").map(Number);
    day = d; month = m; year = y;
  }
  return `${numberToWords(day)} de ${MONTH_NAMES[month - 1]} de ${numberToWords(year)}`;
}

const CARDINAIS = ["Um", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez",
  "Onze", "Doze", "Treze", "Catorze", "Quinze", "Dezasseis", "Dezassete", "Dezoito", "Dezanove", "Vinte"];

function getRotuloPonto(index: number): string {
  return `Ponto ${CARDINAIS[index] || String(index + 1)}:`;
}

// ─── Helpers: Fraction parsing ──────────────────────────────────────────────

function splitFracao(fracao: string): { code: string; desc: string } {
  const sepIndex = fracao.indexOf(" - ");
  const enDashIndex = fracao.indexOf(" – ");
  const idx = sepIndex !== -1 ? sepIndex : enDashIndex;
  if (idx !== -1) {
    const sep = sepIndex !== -1 ? " - " : " – ";
    return { code: fracao.substring(0, idx), desc: fracao.substring(idx + sep.length).trim() };
  }
  return { code: fracao, desc: fracao };
}

// ─── Company formatting types & defaults ────────────────────────────────────

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

const DEFAULT_TEXTS: Required<CompanyFormattingTexts> = {
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
  point_paragraph_template: "Ponto [número cardinal por extenso]: [Título]- [Texto da deliberação]",
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
  fmt: CompanyFormattingTexts,
  key: K,
) => fmt[key]?.trim() || DEFAULT_TEXTS[key];

// ─── Format permilagem/percentage ───────────────────────────────────────────

function fmtPermilagem(val: number): string {
  return val.toFixed(4).replace(".", ",");
}

function fmtPercentagem(val: number): string {
  return val.toFixed(2).replace(".", ",");
}

// ─── Build attendance/absentee item ─────────────────────────────────────────

function buildCondominoLine(c: any, template: string): string {
  const { code, desc } = splitFracao(c.fracao);
  const permilagem = typeof c.permilagem === "number"
    ? fmtPermilagem(c.permilagem)
    : String(c.permilagem || "").replace(".", ",");

  let line = template
    .replace("[Nome completo]", c.nome || "")
    .replace("[X]", code)
    .replace("[descrição]", desc)
    .replace("[permilagem]", permilagem);


  if (c.representado) {
    line = line.replace(/;?\s*$/, " (representado);");
  }

  return line;
}

// ─── Build debts section ────────────────────────────────────────────────────

function buildDividas(dividasData: any, fmt: CompanyFormattingTexts): string {
  if (!dividasData?.dividas?.length) return "";

  const intro = getText(fmt, "debt_section_intro_text");
  const totalLabel = getText(fmt, "debt_total_label");
  const quotaExtraLabel = getText(fmt, "debt_quota_extra_label");
  const headerTpl = getText(fmt, "debt_header_template");
  const detailTpl = getText(fmt, "debt_detail_template");

  const lines: string[] = ["\n\n" + intro];

  for (const d of dividasData.dividas) {
    const header = headerTpl
      .replaceAll("[X]", d.fracao || "")
      .replaceAll("[Descrição]", d.descricao || d.fracao || "")
      .replaceAll("[Valor por extenso]", `[VALOR POR EXTENSO de ${d.valorDivida}€]`)
      .replaceAll("[valor numérico]", d.valorDivida || "");

    lines.push(header);

    if (d.detalhes?.length) {
      for (const det of d.detalhes) {
        if (det.quotaExtra) {
          lines.push(`o  ${quotaExtraLabel} ${det.quotaExtra} (€ ${det.total || "____"});`);
          continue;
        }
        const singleMonth = det.mesInicio === det.mesFim;
        const fromText = singleMonth
          ? `do mês de ${det.mesInicio} do ano ${det.ano}`
          : `do mês de ${det.mesInicio} até ao mês de ${det.mesFim} do ano ${det.ano}`;

        let detLine = detailTpl
          .replaceAll("[mês]", det.mesInicio || "")
          .replaceAll("[mês início]", det.mesInicio || "")
          .replaceAll("[mês fim]", det.mesFim || det.mesInicio || "")
          .replaceAll("[ano]", det.ano || "")
          .replaceAll("[periodo]", fromText);

        // Replace totals
        detLine = detLine
          .replace("(€ ____)", `(€ ${det.total || "____"})`)
          .replace("quotização (€ ____)", `quotização (€ ${det.quotizacao || "____"})`)
          .replace("fundo de reserva (€ ____)", `fundo de reserva (€ ${det.fundoReserva && det.fundoReserva !== "__" ? det.fundoReserva : "____"})`);

        lines.push(detLine);
      }
    }
  }

  lines.push(`${totalLabel} ${dividasData.totalDivida}€`);
  return lines.join("\n");
}

// ─── Main: Build the ata deterministically ──────────────────────────────────

interface BuildResult {
  fullText: string;
  customPoints: { index: number; titulo: string; notas: string }[];
}

function buildAtaDeterministic(
  formData: any,
  fmt: CompanyFormattingTexts,
): BuildResult {
  const {
    numeroAta, nomeCondominio, morada, nifCondominio,
    freguesia, concelho, localReuniao, dataAssembleia,
    horaInicio, tipoAssembleia, convocatoria, presidenteMesa,
    presencasData, pontosOrdemDia, dividasData,
  } = formData;

  const sections: string[] = [];
  const customPoints: BuildResult["customPoints"] = [];

  // ── Title
  sections.push(`ATA NÚMERO ${(numeroAta || "").toUpperCase()}\n`);

  // ── Opening paragraph
  const tipoLabel = tipoAssembleia === "ordinaria" ? "Ordinária" : "Extraordinária";
  const convLabel = convocatoria === "primeira" ? "1ª" : "2ª";
  const dataExtenso = dataAssembleia ? dateToWords(dataAssembleia) : "[data]";

  let opening = getText(fmt, "opening_paragraph_template")
    .replace("[data por extenso]", dataExtenso)
    .replace("[hora]", horaInicio || "")
    .replace("[local]", localReuniao || "Hall de entrada")
    .replace("[convocatória]", convLabel)
    .replace("[Ordinária/Extraordinária]", tipoLabel)
    .replace("[morada]", morada || "")
    .replace("[concelho]", concelho || "")
    .replace("[NIF]", nifCondominio || "");

  sections.push(opening);

  // ── Agenda items list
  const agendaTpl = getText(fmt, "agenda_item_template");
  if (pontosOrdemDia?.length) {
    const agendaLines = pontosOrdemDia.map((p: any, i: number) =>
      agendaTpl
        .replace("[numero]", String(i + 1))
        .replace("[titulo]", p.titulo || "")
    );
    sections.push(agendaLines.join("\n"));
  }

  // ── Attendance
  const attendanceIntro = getText(fmt, "attendance_intro_text");
  const attendanceTpl = getText(fmt, "attendance_item_template");
  const absenteesIntro = getText(fmt, "absentees_intro_text");
  const absenteeTpl = getText(fmt, "absentee_item_template");

  if (presencasData) {
    sections.push(attendanceIntro);
    if (presencasData.presentes?.length) {
      const presLines = presencasData.presentes.map((c: any) =>
        buildCondominoLine(c, attendanceTpl)
      );
      sections.push(presLines.join("\n"));
    }
    if (presencasData.ausentes?.length) {
      sections.push("\n" + absenteesIntro);
      const ausLines = presencasData.ausentes.map((c: any) =>
        buildCondominoLine(c, absenteeTpl)
      );
      sections.push(ausLines.join("\n"));
    }
  }

  // ── Legal opening (permilagem sum + percentage)
  let somaPermilagem = 0;
  if (presencasData?.presentes?.length) {
    for (const c of presencasData.presentes) {
      const val = typeof c.permilagem === "number"
        ? c.permilagem
        : parseFloat(String(c.permilagem || "0").replace(",", "."));
      if (!isNaN(val)) somaPermilagem += val;
    }
  }
  const percentagem = somaPermilagem / 10;

  let legalText = getText(fmt, "legal_opening_text")
    .replace("[SOMA das permilagens dos presentes]", fmtPermilagem(somaPermilagem))
    .replace("[percentagem]", fmtPercentagem(percentagem))
    .replace("[nome presidente]", presidenteMesa || "");

  sections.push(legalText);

  // ── Points (deliberations)
  if (pontosOrdemDia?.length) {
    for (let i = 0; i < pontosOrdemDia.length; i++) {
      const p = pontosOrdemDia[i];
      const rotulo = getRotuloPonto(i);

      if (p.tipo === "padrao" && p.descricaoPadrao) {
        // Preset text: insert verbatim
        let pointText = `${rotulo} ${p.titulo}\n${p.descricaoPadrao}`;
        if (p.notas) {
          pointText += `\n${p.notas}`;
        }
        sections.push(pointText);
      } else {
        // Custom point: placeholder for AI
        customPoints.push({ index: i, titulo: p.titulo || "", notas: p.notas || "" });
        sections.push(`${rotulo} ${p.titulo}\n{{AI_PONTO_${i}}}`);
      }
    }
  }

  // ── Debts
  const dividasText = buildDividas(dividasData, fmt);
  if (dividasText) sections.push(dividasText);

  // ── Closing
  const closingText = getText(fmt, "closing_text");
  sections.push(closingText);

  // ── Signatures
  const sigTitle = getText(fmt, "signatures_title");
  const sigTpl = getText(fmt, "signature_item_template");
  sections.push(`${sigTitle} _____________________________________________________________`);

  if (presencasData?.presentes?.length) {
    const sigLines = presencasData.presentes.map((c: any) => {
      const { desc } = splitFracao(c.fracao);
      return sigTpl.replace("[Descrição fração]", desc);
    });
    sections.push(sigLines.join("\n"));
  }

  return {
    fullText: sections.join("\n\n"),
    customPoints,
  };
}

// ─── AI call for custom points only ─────────────────────────────────────────

async function generateCustomPointTexts(
  customPoints: BuildResult["customPoints"],
  formData: any,
  customInstructions: string,
): Promise<Record<number, string>> {
  if (customPoints.length === 0) return {};

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const contextInfo = `Condomínio: ${formData.nomeCondominio}, Assembleia ${formData.tipoAssembleia === "ordinaria" ? "Ordinária" : "Extraordinária"}, Data: ${formData.dataAssembleia}`;

  const pointsDesc = customPoints.map((p) =>
    `PONTO_INDEX_${p.index}: Título: "${p.titulo}" | Notas: "${p.notas || "Sem notas adicionais"}"`
  ).join("\n");

  const systemPrompt = `És um assistente especializado em redigir deliberações para atas de assembleias de condomínios em Portugal.
Escreve em português europeu formal. NÃO uses markdown (sem #, **, ---, etc.). Texto corrido simples.
Escreve APENAS os textos de deliberação pedidos, um por linha, no formato:
PONTO_INDEX_X: [texto da deliberação]

Cada deliberação deve ser um parágrafo formal descrevendo o que foi deliberado/discutido nesse ponto.
NÃO incluas o título do ponto nem o rótulo "Ponto Um/Dois/etc" — apenas o texto da deliberação.
${customInstructions ? `\nInstruções adicionais da empresa: ${customInstructions}` : ""}`;

  const userPrompt = `Contexto: ${contextInfo}\n\nGera as deliberações para os seguintes pontos personalizados:\n${pointsDesc}`;

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
      stream: false,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("AI error for custom points:", response.status, t);
    // Return fallback text
    const result: Record<number, string> = {};
    for (const p of customPoints) {
      result[p.index] = `Ponto deliberado conforme discussão em assembleia. ${p.notas || ""}`.trim();
    }
    return result;
  }

  const data = await response.json();
  const aiText = data.choices?.[0]?.message?.content || "";

  // Parse AI response
  const result: Record<number, string> = {};
  for (const p of customPoints) {
    const regex = new RegExp(`PONTO_INDEX_${p.index}:\\s*(.+?)(?=PONTO_INDEX_|$)`, "s");
    const match = aiText.match(regex);
    result[p.index] = match ? match[1].trim() : `Ponto deliberado conforme discussão em assembleia. ${p.notas || ""}`.trim();
  }

  return result;
}

// ─── Convert final text to SSE stream ───────────────────────────────────────

function textToSSEStream(text: string): ReadableStream {
  const encoder = new TextEncoder();
  // Chunk the text to simulate streaming for smooth UX
  const CHUNK_SIZE = 80;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        const sseData = JSON.stringify({
          choices: [{ delta: { content: chunks[index] } }],
        });
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        index++;
      } else {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

// ─── Fetch company formatting ───────────────────────────────────────────────

async function fetchCompanyFormatting(companyId: string): Promise<{ formatting: CompanyFormattingTexts; customInstructions: string }> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { formatting: {}, customInstructions: "" };

  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/company_formatting?company_id=eq.${companyId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    if (!resp.ok) return { formatting: {}, customInstructions: "" };
    const data = await resp.json();
    if (!data?.[0]) return { formatting: {}, customInstructions: "" };

    const row = data[0];
    return {
      customInstructions: row.ai_custom_instructions || "",
      formatting: {
        opening_paragraph_template: row.opening_paragraph_template,
        agenda_item_template: row.agenda_item_template,
        attendance_intro_text: row.attendance_intro_text,
        attendance_item_template: row.attendance_item_template,
        absentees_intro_text: row.absentees_intro_text,
        absentee_item_template: row.absentee_item_template,
        legal_opening_text: row.legal_opening_text,
        point_paragraph_template: row.point_paragraph_template,
        closing_text: row.closing_text,
        signatures_title: row.signatures_title,
        signature_item_template: row.signature_item_template,
        debt_section_intro_text: row.debt_section_intro_text,
        debt_total_label: row.debt_total_label,
        debt_quota_extra_label: row.debt_quota_extra_label,
        debt_header_template: row.debt_header_template,
        debt_detail_template: row.debt_detail_template,
      },
    };
  } catch (e) {
    console.error("Failed to fetch formatting:", e);
    return { formatting: {}, customInstructions: "" };
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { formData } = await req.json();

    // Fetch company formatting if available
    let companyFormatting: CompanyFormattingTexts = {};
    let customInstructions = "";
    if (formData.companyId) {
      const result = await fetchCompanyFormatting(formData.companyId);
      companyFormatting = result.formatting;
      customInstructions = result.customInstructions;
    }

    // Step 1: Build ata deterministically
    const { fullText, customPoints } = buildAtaDeterministic(formData, companyFormatting);

    // Step 2: Generate AI text ONLY for custom points (if any)
    let finalText = fullText;
    if (customPoints.length > 0) {
      const aiTexts = await generateCustomPointTexts(customPoints, formData, customInstructions);
      for (const [idx, text] of Object.entries(aiTexts)) {
        finalText = finalText.replace(`{{AI_PONTO_${idx}}}`, text);
      }
    }

    // Clean up any unreplaced placeholders
    finalText = finalText.replace(/\{\{AI_PONTO_\d+\}\}/g, "Ponto deliberado conforme discussão em assembleia.");

    // Step 3: Stream result back as SSE (frontend expects this format)
    const stream = textToSSEStream(finalText);

    return new Response(stream, {
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
