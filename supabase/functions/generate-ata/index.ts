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

TEXTOS FIXOS OBRIGATÓRIOS (quando o ponto é marcado como "padrão", usa o texto fornecido na descricaoPadrao TAL QUAL, sem alterar nem resumir):

Para o ponto de APRESENTAÇÃO DAS CONTAS, usa o texto padrão fornecido. Se tiver notas adicionais com valores de saldo, preenche os espaços em branco.

Para o ponto de ELEIÇÃO DA ADMINISTRAÇÃO, usa SEMPRE este texto EXATO, palavra por palavra, sem alterar NADA:
"Foi nomeada a Empresa Condomínio Dinâmico, Lda., com NIF 513 259 678, representada pela Sra. Dina Isabel Lopes Jordão Inverno, Foi deliberado pelos presentes na Assembleia eleger com elo de ligação e titulares da conta bancária, Sr. ________, representante da fração _ \"____\" e a gerente da empresa Condomínio Dinâmico, Lda. com o NIPC 513 259 678, representada pela Sra. Dina Isabel Lopes Jordão Inverno, com o número de contribuinte 198891962. Foi dada autorização por unanimidade dos presentes para alterar, bem como consultar ou requisitar qualquer tipo de serviço que a entidade bancaria disponibilize numa conta à ordem ou a prazo em nome do condomínio, para a movimentação da mesma será necessário a assinatura dos dois titulares. Foi também aprovado por unanimidade que para além das funções previstas no código civil pelo art.º 1436º, conferir poderes à gerência do condomínio dinâmico a representação perante organismos públicos e entidades oficiais pelo condomínio."
Se houver notas adicionais com nome e fração do titular, preenche APENAS os espaços em branco (Sr. ________, fração _, "____").

Para o ponto de ORÇAMENTO PREVISIONAL, usa o texto padrão fornecido. Se tiver notas adicionais com valores, preenche os espaços em branco.

Para o ponto de PENALIZAÇÃO/COBRANÇA JUDICIAL, usa o texto padrão fornecido TAL QUAL, sem modificar nenhuma palavra.

Para o ponto de ATUALIZAÇÃO DOS VALORES EM DÍVIDA, usa o texto padrão fornecido como introdução, seguido da lista de dívidas EXATAMENTE como fornecida nos dados. COPIA TAL QUAL, incluindo os "____" nos valores. O utilizador preencherá os valores depois.

Para o ponto de SEGURO DAS FRAÇÕES, usa o texto padrão fornecido TAL QUAL, sem modificar.

FORMATO DAS DÍVIDAS (no ponto de atualização dos valores em dívida):
COPIA A SECÇÃO DE DÍVIDAS TAL QUAL COMO É FORNECIDA NOS DADOS DO UTILIZADOR. NÃO alteres NADA. Mantém os "____" nos campos de quotização, fundo de reserva e totais.

Formato de cada fração:
✓ Fração [X] – [Descrição] – [Valor por extenso em português, ex: Quinhentos e trinta euros e vinte e quatro cêntimos] (€ [valor numérico com vírgula decimal, ex: 530,24]) correspondentes:
IMPORTANTE: Converte SEMPRE o valor numérico para texto por extenso em português europeu. Usa vírgula como separador decimal no valor numérico entre parênteses.
o  a quotização (€ ____) e fundo de reserva (€ ____) do mês de [mês] até ao mês de [mês] do ano [ano] (€ ____);

Cada ano DIFERENTE fica numa linha "o" SEPARADA.
Cada quota extra fica numa linha "o" separada.
NUNCA juntes anos diferentes na mesma linha.
Mantém SEMPRE os "____" — o utilizador preenche depois.

Exemplo CORRETO:
✓ Fração R/ch Esq. – R/ch Esq. – Quinhentos e trinta euros e vinte e quatro cêntimos (€ 530,24) correspondentes:
o  a quotização (€ ____) e fundo de reserva (€ ____) do mês de outubro até ao mês de dezembro do ano 2024 (€ ____);
o  a quotização (€ ____) e fundo de reserva (€ ____) do mês de janeiro até ao mês de dezembro do ano 2025 (€ ____);
o  a quotização (€ ____) e fundo de reserva (€ ____) do mês de janeiro até ao mês de fevereiro do ano 2026 (€ ____);

NÃO uses tabelas. NÃO uses markdown. Texto corrido com marcadores ✓ e o.`;
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

function parseObservacoesToPeriods(obs: string): string[] {
  // Parse "Oct/2024-Feb/2026" or "Jan/2026-Fev/2026" into year-separated period lines
  const monthMap: Record<string, string> = {
    "jan": "janeiro", "fev": "fevereiro", "mar": "março", "abr": "abril",
    "mai": "maio", "maio": "maio", "jun": "junho", "jul": "julho", "ago": "agosto",
    "set": "setembro", "out": "outubro", "oct": "outubro", "nov": "novembro", "dez": "dezembro",
    "dec": "dezembro", "feb": "fevereiro", "apr": "abril", "aug": "agosto", "sep": "setembro",
  };
  const toMonth = (s: string) => monthMap[s.toLowerCase()] || s.toLowerCase();
  
  const match = obs?.match(/([A-Za-zç]+)\/(\d{4})\s*-\s*([A-Za-zç]+)\/(\d{4})/);
  if (!match) return [];
  
  const [, m1, y1, m2, y2] = match;
  const startYear = parseInt(y1);
  const endYear = parseInt(y2);
  
  const allMonths = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const startIdx = allMonths.indexOf(toMonth(m1));
  const endIdx = allMonths.indexOf(toMonth(m2));
  
  if (startIdx === -1 || endIdx === -1) return [];
  
  const lines: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const from = year === startYear ? allMonths[startIdx] : "janeiro";
    const to = year === endYear ? allMonths[endIdx] : "dezembro";
    const meses = from === to
      ? `do mês de ${from} do ano ${year}`
      : `do mês de ${from} até ao mês de ${to} do ano ${year}`;
    lines.push(`o  a quotização (€ ____) e fundo de reserva (€ ____) ${meses} (€ ____);`);
  }
  return lines;
}

function formatDividas(dividasData: any): string {
  if (!dividasData?.dividas?.length) return "";
  
  const formatDetalhe = (det: any): string => {
    if (det.quotaExtra) {
      const totalVal = det.total || "____";
      return `o  Quota extra ${det.quotaExtra} (€ ${totalVal});`;
    }
    const meses = det.mesInicio === det.mesFim
      ? `do mês de ${det.mesInicio} do ano ${det.ano}`
      : `do mês de ${det.mesInicio} até ao mês de ${det.mesFim} do ano ${det.ano}`;
    const quotVal = det.quotizacao || "____";
    const frVal = det.fundoReserva && det.fundoReserva !== "__" ? det.fundoReserva : "____";
    const totalVal = det.total || "____";
    return `o  a quotização (€ ${quotVal}) e fundo de reserva (€ ${frVal}) ${meses} (€ ${totalVal});`;
  };

  return `\n\nDÍVIDAS AO CONDOMÍNIO (COPIAR TAL QUAL PARA A ATA):\n` +
    dividasData.dividas.map((d: any) => {
      const header = `✓ Fração ${d.fracao} – ${d.descricao || d.fracao} – [VALOR POR EXTENSO de ${d.valorDivida}€] (€ ${d.valorDivida}) correspondentes:`;
      if (d.detalhes?.length) {
        return header + "\n" + d.detalhes.map(formatDetalhe).join("\n");
      }
      // Fallback: parse observacoes field for date ranges
      if (d.observacoes) {
        const periodLines = parseObservacoesToPeriods(d.observacoes);
        if (periodLines.length) {
          return header + "\n" + periodLines.join("\n");
        }
      }
      return header;
    }).join("\n") +
    `\nTotal geral em dívida ao condomínio: ${dividasData.totalDivida}€`;
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
