// Deterministic debt grouping helpers — shared logic used by generate-ata.
// Rules:
//  - Group only consecutive months of the same year and same debt type.
//  - Never merge across years.
//  - Never merge different debt types (quotização+fundo vs quota extra vs crédito vs seguro).
//  - Report warnings when sum of subitems doesn't match the fraction total.

const MONTH_ORDER: Record<string, number> = {
  janeiro: 1, fevereiro: 2, "março": 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const MONTH_NAMES = [
  "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export interface RawDetail {
  quotizacao?: string;
  fundoReserva?: string;
  mesInicio?: string;
  mesFim?: string;
  ano?: string;
  total?: string;
  quotaExtra?: string;
}

export interface GroupedSubitem {
  kind: "quotizacao_fundo" | "quota_extra" | "credito" | "outro";
  quotizacao?: number;
  fundoReserva?: number;
  mesInicio?: string;
  mesFim?: string;
  ano?: string;
  descricao?: string;
  total: number;
}

export interface DebtWarning {
  fracao: string;
  totalLido: number;
  totalCalculado: number;
  diferenca: number;
}

const parseMoney = (v?: string | number | null): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[€\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const normalizeMonth = (m?: string): string => {
  if (!m) return "";
  const key = m.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const remap: Record<string, string> = {
    janeiro: "janeiro", fevereiro: "fevereiro", marco: "março",
    abril: "abril", maio: "maio", junho: "junho", julho: "julho",
    agosto: "agosto", setembro: "setembro", outubro: "outubro",
    novembro: "novembro", dezembro: "dezembro",
  };
  return remap[key] || m.toLowerCase().trim();
};

export interface GroupedDebt {
  fracao: string;
  descricao: string;
  nome: string;
  totalLido: number;
  totalCalculado: number;
  subitens: GroupedSubitem[];
}

export function groupDebts(
  dividas: Array<{
    fracao: string;
    nome: string;
    descricao?: string;
    valorDivida: string | number;
    detalhes?: RawDetail[];
  }>,
): { grouped: GroupedDebt[]; warnings: DebtWarning[] } {
  const grouped: GroupedDebt[] = [];
  const warnings: DebtWarning[] = [];

  for (const d of dividas || []) {
    const totalLido = parseMoney(d.valorDivida);
    const subitens: GroupedSubitem[] = [];

    // First, split details into buckets: monthly quotização/fundo vs extra vs credit
    interface MonthlyEntry {
      mes: string; mesNum: number; ano: string;
      quotizacao: number; fundoReserva: number; totalMes: number;
    }
    const monthly: MonthlyEntry[] = [];
    const extras: GroupedSubitem[] = [];

    for (const det of d.detalhes || []) {
      if (det.quotaExtra) {
        extras.push({
          kind: "quota_extra",
          descricao: det.quotaExtra,
          total: parseMoney(det.total),
        });
        continue;
      }
      // Credit detection (heuristic): descrição has "crédito" or "transferência" — not in current schema, skip
      const mi = normalizeMonth(det.mesInicio);
      const mf = normalizeMonth(det.mesFim || det.mesInicio);
      const ano = det.ano || "";
      const quot = parseMoney(det.quotizacao);
      const fr = parseMoney(det.fundoReserva);
      const totalPeriodo = parseMoney(det.total);

      const startNum = MONTH_ORDER[mi] || 0;
      const endNum = MONTH_ORDER[mf] || startNum;
      if (!startNum || !ano) {
        // Unable to place — treat as opaque period
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
        monthly.push({
          mes: MONTH_NAMES[m],
          mesNum: m,
          ano,
          quotizacao: quot,
          fundoReserva: fr,
          totalMes: perMonth,
        });
      }
    }

    // Sort monthly by year, then month
    monthly.sort((a, b) => (a.ano === b.ano ? a.mesNum - b.mesNum : a.ano.localeCompare(b.ano)));

    // Group consecutive months within same year with same quotização+fundo values
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
      warnings.push({
        fracao: d.fracao,
        totalLido,
        totalCalculado,
        diferenca: diff,
      });
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
