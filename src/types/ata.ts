export interface PontoOrdemDia {
  id: string;
  titulo: string;
  tipo: "padrao" | "personalizado";
  descricaoPadrao?: string;
  notas?: string;
}

export interface Condomino {
  nome: string;
  fracao: string;
  nif: string;
  permilagem: string;
  representado?: boolean;
}

export interface PresencasData {
  presentes: Condomino[];
  ausentes: Condomino[];
  totalPermilagem: string;
}

export interface DetalhesDivida {
  quotizacao?: string;
  fundoReserva?: string;
  mesInicio?: string;
  mesFim?: string;
  ano?: string;
  total?: string;
  quotaExtra?: string;
}

export interface DividaCondomino {
  fracao: string;
  nome: string;
  descricao?: string;
  valorDivida: string;
  mesesAtraso?: string;
  observacoes?: string;
  detalhes?: DetalhesDivida[];
}

export interface DividasData {
  dividas: DividaCondomino[];
  totalDivida: string;
}

export interface AtaFormData {
  numeroAta: string;
  nomeCondominio: string;
  morada: string;
  nifCondominio: string;
  freguesia: string;
  concelho: string;
  localReuniao: string;
  dataAssembleia: string;
  horaInicio: string;
  tipoAssembleia: string;
  convocatoria: string;
  presidenteMesa: string;
  totalFracoes: string;
  fracoesPresentes: string;
  fracoesRepresentadas: string;
  percentagemPresente: string;
  pontosOrdemDia: PontoOrdemDia[];
  presencasData: PresencasData | null;
  dividasData: DividasData | null;
  observacoesAdicionais: string;
}

export interface CompanyTemplate {
  id: string;
  company_id: string;
  pontos_padrao: PontoOrdemDia[];
  local_reuniao_padrao: string;
  presidente_mesa_padrao: string;
}

// Default empty point for companies without templates
export const PONTO_VAZIO: PontoOrdemDia = {
  id: "p1",
  titulo: "",
  tipo: "personalizado",
  notas: "",
};

export const getDefaultFormData = (
  template?: CompanyTemplate | null
): AtaFormData => ({
  numeroAta: "",
  nomeCondominio: "",
  morada: "",
  nifCondominio: "",
  freguesia: "",
  concelho: "",
  localReuniao: template?.local_reuniao_padrao || "",
  dataAssembleia: "",
  horaInicio: "",
  tipoAssembleia: "ordinaria",
  convocatoria: "primeira",
  presidenteMesa: template?.presidente_mesa_padrao || "",
  totalFracoes: "",
  fracoesPresentes: "",
  fracoesRepresentadas: "",
  percentagemPresente: "",
  pontosOrdemDia:
    template?.pontos_padrao && template.pontos_padrao.length > 0
      ? template.pontos_padrao.map((p) => ({ ...p }))
      : [{ ...PONTO_VAZIO }],
  presencasData: null,
  dividasData: null,
  observacoesAdicionais: "",
});
