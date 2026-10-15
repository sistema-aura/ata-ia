// Geração do texto da secção de dívidas no cliente (sem IA).
// Porta da lógica determinística usada na geração da ata.

const MONTH_ORDER: Record<string, number> = {
  janeiro: 1, fevereiro: 2, "março": 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const MONTH_NAMES = [
  "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export const parseMoney = (v?: string | number | null): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  let s = String(v).replace(/[^\d.,-]/g, "").trim();
  if (!s) return 0;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (lastDot >= 0 && lastComma >= 0) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const decimals = s.length - lastComma - 1;
    s = decimals === 3 && /^\d{1,3}(,\d{3})+$/.test(s)
      ? s.replace(/,/g, "")
      : s.replace(",", ".");
  } else if (lastDot >= 0) {
    const decimals = s.length - lastDot - 1;
    s = decimals === 3 && /^\d{1,3}(\.\d{3})+$/.test(s)
      ? s.replace(/\./g, "")
      : s;
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

export const fmtMoney = (n: number): string =>
  n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const UNITS = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const TEENS = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezasseis", "dezassete", "dezoito", "dezanove"];
const TENS = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

export function numberToWords(n: number): string {
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
    if (n > 0) parts.push("e");
  }

  if (n >= 100) {
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

export function moneyToWords(n: number): string {
  const euros = Math.floor(n);
  const cents = Math.round((n - euros) * 100);
  const parts: string[] = [];
  if (euros > 0) {
    parts.push(numberToWords(euros) + (euros === 1 ? " euro" : " euros"));
  } else if (cents === 0) {
    return "zero euros";
  }
  if (cents > 0) {
    parts.push((euros > 0 ? " e " : "") + numberToWords(cents) + (cents === 1 ? " cêntimo" : " cêntimos"));
  }
  return parts.join("");
}

const normalizeMonth = (m?: string): string => {
  if (!m) return "";
  const key = m.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const remap: Record<string, string> = {
    janeiro: "janeiro", fevereiro: "fevereiro", marco: "março",
    abril: "abril", maio: "maio", junho: "junho", julho: "julho",
    agosto: "agosto", setembro: "setembro", outubro: "outubro",
    novembro: "novembro", dezembro: "dezembro",
  };
  return remap[key] || m.toLowerCase().trim();
};

export interface GroupedSubitem {
  kind: "quotizacao_fundo" | "quota_extra" | "outro";
  quotizacao?: number;
  fundoReserva?: number;
  mesInicio?: string;
  mesFim?: string;
  ano?: string;
  descricao?: string;
  total: number;
}

export interface GroupedDebt {
  fracao: string;
  descricao: string;
  nome: string;
  totalLido: number;
  totalCalculado: number;
  subitens: GroupedSubitem[];
}

export interface DebtWarning {
  fracao: string;
  totalLido: number;
  totalCalculado: number;
  diferenca: number;
}

export function groupDebts(
  dividas: Array<{
    fracao: string;
    nome: string;
    descricao?: string;
    valorDivida: string | number;
    detalhes?: Array<{
      quotizacao?: string; fundoReserva?: string; mesInicio?: string;
      mesFim?: string; ano?: string; total?: string; quotaExtra?: string;
    }>;
  }>,
): { grouped: GroupedDebt[]; warnings: DebtWarning[] } {
  const grouped: GroupedDebt[] = [];
  const warnings: DebtWarning[] = [];

  for (const d of dividas || []) {
    const totalLido = parseMoney(d.valorDivida);
    const subitens: GroupedSubitem[] = [];

    interface MonthlyEntry {
      mes: string; mesNum: number; ano: string;
      quotizacao: number; fundoReserva: number; totalMes: number;
    }
    const monthly: MonthlyEntry[] = [];
    const extras: GroupedSubitem[] = [];

    for (const det of d.detalhes || []) {
      if (det.quotaExtra) {
        extras.push({ kind: "quota_extra", descricao: det.quotaExtra, total: parseMoney(det.total) });
        continue;
      }
      const mi = normalizeMonth(det.mesInicio);
      const mf = normalizeMonth(det.mesFim || det.mesInicio);
      const ano = det.ano || "";
      const quot = parseMoney(det.quotizacao);
      const fr = parseMoney(det.fundoReserva);
      const totalPeriodo = parseMoney(det.total);

      const startNum = MONTH_ORDER[mi] || 0;
      const endNum = MONTH_ORDER[mf] || startNum;
      if (!startNum || !ano) {
        subitens.push({
          kind: "outro",
          descricao: `${mi || "período"}${mf && mf !== mi ? " a " + mf : ""} ${ano}`.trim(),
          total: totalPeriodo,
        });
        continue;
      }

      const months = Math.max(1, endNum - startNum + 1);
      const perMonth = (quot + fr) || (totalPeriodo / months);
      for (let m = startNum; m <= endNum; m++) {
        monthly.push({ mes: MONTH_NAMES[m], mesNum: m, ano, quotizacao: quot, fundoReserva: fr, totalMes: perMonth });
      }
    }

    monthly.sort((a, b) => (a.ano === b.ano ? a.mesNum - b.mesNum : a.ano.localeCompare(b.ano)));

    let i = 0;
    while (i < monthly.length) {
      const start = monthly[i];
      let j = i;
      while (
        j + 1 < monthly.length &&
        monthly[j + 1].ano === start.ano &&
        monthly[j + 1].mesNum === monthly[j].mesNum + 1 &&
        monthly[j + 1].quotizacao === start.quotizacao &&
        monthly[j + 1].fundoReserva === start.fundoReserva
      ) {
        j++;
      }
      const runTotal = monthly.slice(i, j + 1).reduce((s, m) => s + m.totalMes, 0);
      subitens.push({
        kind: "quotizacao_fundo",
        quotizacao: start.quotizacao,
        fundoReserva: start.fundoReserva,
        mesInicio: start.mes,
        mesFim: monthly[j].mes,
        ano: start.ano,
        total: Math.round(runTotal * 100) / 100,
      });
      i = j + 1;
    }

    subitens.push(...extras);

    const totalCalculado = Math.round(subitens.reduce((s, x) => s + x.total, 0) * 100) / 100;
    const diff = Math.round((totalLido - totalCalculado) * 100) / 100;
    if (Math.abs(diff) > 0.02) {
      warnings.push({ fracao: d.fracao, totalLido, totalCalculado, diferenca: diff });
    }

    grouped.push({
      fracao: d.fracao,
      descricao: d.descricao || d.fracao,
      nome: d.nome || "",
      totalLido,
      totalCalculado,
      subitens,
    });
  }

  return { grouped, warnings };
}

export interface DebtTextResult {
  text: string;
  warnings: DebtWarning[];
}

export interface DebtFormatting {
  debt_section_intro_text?: string;
  debt_total_label?: string;
}

const DEFAULT_INTRO = "DÍVIDAS AO CONDOMÍNIO (COPIAR TAL QUAL PARA A ATA):";
const DEFAULT_TOTAL_LABEL = "Total geral em dívida ao condomínio:";

export function buildDebtText(dividasData: {
  dividas: Array<{
    fracao: string; nome: string; descricao?: string;
    valorDivida: string | number;
    detalhes?: Array<{
      quotizacao?: string; fundoReserva?: string; mesInicio?: string;
      mesFim?: string; ano?: string; total?: string; quotaExtra?: string;
    }>;
  }>;
  totalDivida: string;
}, fmt?: DebtFormatting): DebtTextResult {
  if (!dividasData?.dividas?.length) return { text: "", warnings: [] };

  const intro = fmt?.debt_section_intro_text?.trim() || DEFAULT_INTRO;
  const totalLabel = fmt?.debt_total_label?.trim() || DEFAULT_TOTAL_LABEL;
  const { grouped, warnings } = groupDebts(dividasData.dividas);

  const lines: string[] = [intro];

  for (const d of grouped) {
    const extenso = moneyToWords(d.totalLido);
    const capitalizado = extenso.charAt(0).toUpperCase() + extenso.slice(1);
    lines.push(
      `✓ Fração ${d.fracao} – ${d.descricao} – ${capitalizado} (€ ${fmtMoney(d.totalLido)}) correspondentes:`,
    );

    for (const s of d.subitens) {
      if (s.kind === "quota_extra") {
        lines.push(`o  quota extra relativa a ${s.descricao} (€ ${fmtMoney(s.total)});`);
        continue;
      }
      if (s.kind === "outro") {
        lines.push(`o  ${s.descricao} (€ ${fmtMoney(s.total)});`);
        continue;
      }
      const singleMonth = s.mesInicio === s.mesFim;
      const periodo = singleMonth
        ? `do mês de ${s.mesInicio} do ano ${s.ano}`
        : `do mês de ${s.mesInicio} até ao mês de ${s.mesFim} do ano ${s.ano}`;
      const quotStr = s.quotizacao !== undefined ? fmtMoney(s.quotizacao) : "____";
      const frStr = s.fundoReserva !== undefined ? fmtMoney(s.fundoReserva) : "____";
      lines.push(
        `o  a quotização (€ ${quotStr}) e fundo de reserva (€ ${frStr}) ${periodo} (€ ${fmtMoney(s.total)});`,
      );
    }
  }

  lines.push(
    `\n${totalLabel} € ${fmtMoney(parseMoney(dividasData.totalDivida) || grouped.reduce((s, d) => s + d.totalLido, 0))}`,
  );
  return { text: lines.join("\n"), warnings };
}
