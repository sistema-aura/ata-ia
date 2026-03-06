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

export const PONTOS_PADRAO: PontoOrdemDia[] = [
  {
    id: "p1",
    titulo: "Apresentação, debate e aprovação das contas referentes ao exercício 20__",
    tipo: "padrao",
    descricaoPadrao:
      "Foram apresentadas as contas relativamente aos exercícios e aprovadas por unanimidade dos votos presentes de acordo com os documentos apresentados e que se encontram anexos à ata.",
  },
  {
    id: "p2",
    titulo: "Eleição da Administração",
    tipo: "padrao",
    descricaoPadrao:
      "Foi nomeada a Empresa Condomínio Dinâmico, Lda., com NIF 513 259 678, representada pela Sra. Dina Isabel Lopes Jordão Inverno, Foi deliberado pelos presentes na Assembleia eleger com elo de ligação e titulares da conta bancária, Sr. ________, representante da fração _ \"____\" e a gerente da empresa Condomínio Dinâmico, Lda. com o NIPC 513 259 678, representada pela Sra. Dina Isabel Lopes Jordão Inverno, com o número de contribuinte 198891962. Foi dada autorização por unanimidade dos presentes para alterar, bem como consultar ou requisitar qualquer tipo de serviço que a entidade bancaria disponibilize numa conta à ordem ou a prazo em nome do condomínio, para a movimentação da mesma será necessário a assinatura dos dois titulares. Foi também aprovado por unanimidade que para além das funções previstas no código civil pelo art.º 1436º, conferir poderes à gerência do condomínio dinâmico a representação perante organismos públicos e entidades oficiais pelo condomínio.",
  },
  {
    id: "p3",
    titulo: "Apresentação, debate e aprovação do orçamento previsional",
    tipo: "padrao",
    descricaoPadrao:
      "Foi aprovado o orçamento cuja despesa total ascende a € ___ (___ euros e ___ cêntimos), acrescido da verba legal destinada ao fundo de reserva no montante de € ____ (___ euros e ___ cêntimos).",
  },
  {
    id: "p4",
    titulo:
      "Deliberação sobre a criação de uma penalização a aplicar às frações com quotas por liquidar em caso de cobrança pela via judicial",
    tipo: "padrao",
    descricaoPadrao:
      "O Condómino que não proceder ao pagamento da sua quota-parte nas despesas e encargos dentro do prazo fixado (180 dias) pela Assembleia de Condóminos, será sujeito à aplicação de uma multa pelo atraso no pagamento do valor correspondente a 10% do valor em cobrança, sempre em respeito pelo limite legal previsto no n.º 2 do artigo 1434.º do Código Civil (no valor 400,00 €) Serão suportadas pelo condómino em causa, todas as despesas judiciais e extrajudiciais custeadas ( no valor mínimo de 750,00 € + iva) pelo Condomínio para cobrança coerciva dos valores em dívida, incluindo honorários de advogado, solicitador ou agente de execução e custas judiciais presentes e futuros",
  },
  {
    id: "p5",
    titulo: "Atualização dos valores em dívida ao condomínio",
    tipo: "padrao",
    descricaoPadrao:
      "Foi deliberado por unanimidade dos presentes aprovar a informação prestada pela Administração de que se encontram em divida ao condomínio, pelos proprietários das seguintes frações autónomas, as seguintes quantias a data desta assembleia:",
  },
  {
    id: "p6",
    titulo: "Seguro das frações",
    tipo: "padrao",
    descricaoPadrao:
      "Neste ponto os condóminos foram informados que de acordo com a legislação da propriedade horizontal, Art.º 1429º o seguro das frações é obrigatório. Como tal é necessário que seja entregue a Administração uma cópia devidamente atualizada do respetivo RECIBO DE PRÉMIO do seguro.",
  },
  {
    id: "p7",
    titulo: "Outros assuntos de interesse geral para o condomínio",
    tipo: "padrao",
    descricaoPadrao: "",
  },
];

export const INITIAL_FORM_DATA: AtaFormData = {
  numeroAta: "",
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
