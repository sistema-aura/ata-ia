export interface PontoOrdemDia {
  id: string;
  titulo: string;
  tipo: "padrao" | "personalizado";
  descricaoPadrao?: string;
  notas?: string;
}

export interface AtaFormData {
  nomeCondominio: string;
  morada: string;
  dataAssembleia: string;
  horaInicio: string;
  tipoAssembleia: string;
  convocatoria: string;
  presidenteMesa: string;
  secretario: string;
  totalFracoes: string;
  fracoesPresentes: string;
  fracoesRepresentadas: string;
  percentagemPresente: string;
  pontosOrdemDia: PontoOrdemDia[];
  observacoesAdicionais: string;
}

export const PONTOS_PADRAO: PontoOrdemDia[] = [
  {
    id: "p1",
    titulo: "Verificação de presenças e quórum",
    tipo: "padrao",
    descricaoPadrao: "Procedeu-se à verificação das presenças, tendo-se constatado a existência de quórum para deliberação.",
  },
  {
    id: "p2",
    titulo: "Eleição da mesa da assembleia",
    tipo: "padrao",
    descricaoPadrao: "Foi proposta e aprovada por unanimidade a constituição da mesa da assembleia.",
  },
  {
    id: "p3",
    titulo: "Leitura e aprovação da ata da assembleia anterior",
    tipo: "padrao",
    descricaoPadrao: "Foi lida a ata da assembleia anterior, a qual foi aprovada por unanimidade dos presentes.",
  },
  {
    id: "p4",
    titulo: "Apresentação e aprovação das contas do exercício",
    tipo: "padrao",
    descricaoPadrao: "Foram apresentadas as contas do exercício pela administração, incluindo receitas, despesas e saldo.",
  },
  {
    id: "p5",
    titulo: "Aprovação do orçamento para o próximo exercício",
    tipo: "padrao",
    descricaoPadrao: "Foi apresentado e discutido o orçamento previsto para o próximo exercício.",
  },
  {
    id: "p6",
    titulo: "Eleição do administrador",
    tipo: "padrao",
    descricaoPadrao: "Procedeu-se à eleição do administrador do condomínio para o próximo mandato.",
  },
];

export const INITIAL_FORM_DATA: AtaFormData = {
  nomeCondominio: "",
  morada: "",
  dataAssembleia: "",
  horaInicio: "",
  tipoAssembleia: "ordinaria",
  convocatoria: "primeira",
  presidenteMesa: "",
  secretario: "",
  totalFracoes: "",
  fracoesPresentes: "",
  fracoesRepresentadas: "",
  percentagemPresente: "",
  pontosOrdemDia: PONTOS_PADRAO.map((p) => ({ ...p })),
  observacoesAdicionais: "",
};
