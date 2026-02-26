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

export interface DividaCondomino {
  fracao: string;
  nome: string;
  valorDivida: string;
  mesesAtraso?: string;
  observacoes?: string;
}

export interface DividasData {
  dividas: DividaCondomino[];
  totalDivida: string;
}

export interface AtaFormData {
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

export const PONTOS_PADRAO: PontoOrdemDia[] = [
  {
    id: "p1",
    titulo: "Apresentação e aprovação das contas do exercício",
    tipo: "padrao",
    descricaoPadrao:
      "Foram apresentadas as contas relativamente ao exercício e aprovadas por unanimidade dos votos presentes de acordo com os documentos apresentados e que se encontram anexos à ata.",
  },
  {
    id: "p2",
    titulo: "Eleição da administração",
    tipo: "padrao",
    descricaoPadrao:
      "Foi deliberado por unanimidade dos condóminos presentes que a Administração do Condomínio continuará a ser desempenhada pela administração atual, que aceita a nomeação.",
  },
  {
    id: "p3",
    titulo: "Apresentação, debate e aprovação do orçamento previsional",
    tipo: "padrao",
    descricaoPadrao:
      "Foi apresentado, debatido e aprovado o orçamento previsional para o próximo exercício.",
  },
  {
    id: "p4",
    titulo:
      "Deliberação sobre penalização para quotas em atraso (cobrança judicial)",
    tipo: "padrao",
    descricaoPadrao:
      "Foi deliberado por unanimidade dos presentes a criação de uma penalização a aplicar às frações com quotas por liquidar em caso de cobrança pela via judicial.",
  },
  {
    id: "p5",
    titulo: "Atualização dos valores em dívida ao condomínio",
    tipo: "padrao",
    descricaoPadrao:
      "Foi deliberado por unanimidade dos presentes aprovar a informação prestada pela Administração sobre os valores em dívida ao condomínio.",
  },
  {
    id: "p6",
    titulo: "Seguro das frações",
    tipo: "padrao",
    descricaoPadrao:
      "Os condóminos foram informados que, de acordo com a legislação da propriedade horizontal (Art.º 1429.º do CC), o seguro das frações é obrigatório. É necessário que seja entregue à Administração uma cópia atualizada do respetivo recibo de prémio do seguro.",
  },
  {
    id: "p7",
    titulo: "Outros assuntos de interesse geral para o condomínio",
    tipo: "padrao",
    descricaoPadrao: "",
  },
];

export const INITIAL_FORM_DATA: AtaFormData = {
  nomeCondominio: "",
  morada: "",
  nifCondominio: "",
  freguesia: "",
  concelho: "",
  localReuniao: "Hall de entrada",
  dataAssembleia: "",
  horaInicio: "",
  tipoAssembleia: "ordinaria",
  convocatoria: "primeira",
  presidenteMesa: "",
  totalFracoes: "",
  fracoesPresentes: "",
  fracoesRepresentadas: "",
  percentagemPresente: "",
  pontosOrdemDia: PONTOS_PADRAO.map((p) => ({ ...p })),
  presencasData: null,
  dividasData: null,
  observacoesAdicionais: "",
};
