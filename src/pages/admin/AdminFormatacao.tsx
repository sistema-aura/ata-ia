import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { WordFormattingConfig } from "@/lib/exportWord";

interface Company {
  id: string;
  name: string;
}

interface FormattingConfig extends WordFormattingConfig {
  ai_custom_instructions: string;
  nome_empresa_ata: string;
  nif_empresa: string;
  morada_empresa: string;
  opening_paragraph_template: string;
  agenda_item_template: string;
  attendance_intro_text: string;
  attendance_item_template: string;
  absentees_intro_text: string;
  absentee_item_template: string;
  legal_opening_text: string;
  point_paragraph_template: string;
  closing_text: string;
  signatures_title: string;
  signature_item_template: string;
  debt_section_intro_text: string;
  debt_total_label: string;
  debt_quota_extra_label: string;
  debt_header_template: string;
  debt_detail_template: string;
}

const DEFAULTS: FormattingConfig = {
  font_family: "Times New Roman",
  font_size: 22,
  margin_top: 1440,
  margin_bottom: 1440,
  margin_left: 1440,
  margin_right: 1440,
  line_spacing: 240,
  paragraph_spacing_after: 120,
  first_line_indent: 0,
  title_alignment: "center",
  body_alignment: "justify",
  header_text: "",
  footer_text: "",
  ai_custom_instructions: "",
  nome_empresa_ata: "",
  nif_empresa: "",
  morada_empresa: "",
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

const FONT_OPTIONS = [
  "Times New Roman",
  "Arial",
  "Calibri",
  "Cambria",
  "Georgia",
  "Garamond",
  "Century Gothic",
];

const ALIGNMENT_OPTIONS = [
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Direita" },
  { value: "justify", label: "Justificado" },
] as const;

const twipsToCm = (twips: number) => (twips / 567).toFixed(1);
const cmToTwips = (cm: string) => Math.round(parseFloat(cm || "0") * 567);
const halfPtToPt = (hp: number) => (hp / 2).toString();
const ptToHalfPt = (pt: string) => Math.round(parseFloat(pt || "11") * 2);

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
    <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">{title}</h2>
    <p className="mb-4 text-sm text-muted-foreground">{description}</p>
    {children}
  </div>
);

const AdminFormatacao = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyIdParam = searchParams.get("company");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyIdParam || "");
  const [config, setConfig] = useState<FormattingConfig>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      const { data } = await supabase.from("companies").select("id, name").order("name");
      setCompanies((data as Company[]) || []);
      setLoading(false);
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) {
      setConfig({ ...DEFAULTS });
      setExists(false);
      return;
    }

    loadConfig(selectedCompanyId);
  }, [selectedCompanyId]);

  const loadConfig = async (companyId: string) => {
    const { data } = await supabase
      .from("company_formatting")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    if (data) {
      const row = data as any;
      setConfig({
        font_family: row.font_family ?? DEFAULTS.font_family,
        font_size: row.font_size ?? DEFAULTS.font_size,
        margin_top: row.margin_top ?? DEFAULTS.margin_top,
        margin_bottom: row.margin_bottom ?? DEFAULTS.margin_bottom,
        margin_left: row.margin_left ?? DEFAULTS.margin_left,
        margin_right: row.margin_right ?? DEFAULTS.margin_right,
        line_spacing: row.line_spacing ?? DEFAULTS.line_spacing,
        paragraph_spacing_after:
          row.paragraph_spacing_after ?? row.line_spacing ?? DEFAULTS.paragraph_spacing_after,
        first_line_indent: row.first_line_indent ?? DEFAULTS.first_line_indent,
        title_alignment: row.title_alignment ?? DEFAULTS.title_alignment,
        body_alignment: row.body_alignment ?? DEFAULTS.body_alignment,
        header_text: row.header_text ?? "",
        footer_text: row.footer_text ?? "",
        ai_custom_instructions: row.ai_custom_instructions ?? "",
        nome_empresa_ata: row.nome_empresa_ata ?? "",
        nif_empresa: row.nif_empresa ?? "",
        morada_empresa: row.morada_empresa ?? "",
        opening_paragraph_template:
          row.opening_paragraph_template ?? DEFAULTS.opening_paragraph_template,
        agenda_item_template: row.agenda_item_template ?? DEFAULTS.agenda_item_template,
        attendance_intro_text: row.attendance_intro_text ?? DEFAULTS.attendance_intro_text,
        attendance_item_template:
          row.attendance_item_template ?? DEFAULTS.attendance_item_template,
        absentees_intro_text: row.absentees_intro_text ?? DEFAULTS.absentees_intro_text,
        absentee_item_template:
          row.absentee_item_template ?? DEFAULTS.absentee_item_template,
        legal_opening_text: row.legal_opening_text ?? DEFAULTS.legal_opening_text,
        point_paragraph_template:
          row.point_paragraph_template ?? DEFAULTS.point_paragraph_template,
        closing_text: row.closing_text ?? DEFAULTS.closing_text,
        signatures_title: row.signatures_title ?? DEFAULTS.signatures_title,
        signature_item_template:
          row.signature_item_template ?? DEFAULTS.signature_item_template,
        debt_section_intro_text:
          row.debt_section_intro_text ?? DEFAULTS.debt_section_intro_text,
        debt_total_label: row.debt_total_label ?? DEFAULTS.debt_total_label,
        debt_quota_extra_label:
          row.debt_quota_extra_label ?? DEFAULTS.debt_quota_extra_label,
        debt_header_template: row.debt_header_template ?? DEFAULTS.debt_header_template,
        debt_detail_template: row.debt_detail_template ?? DEFAULTS.debt_detail_template,
      });
      setExists(true);
      return;
    }

    setConfig({ ...DEFAULTS });
    setExists(false);
  };

  const updateField = <K extends keyof FormattingConfig>(key: K, value: FormattingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);

    const payload: any = { company_id: selectedCompanyId, ...config };

    let error;
    if (exists) {
      ({ error } = await supabase
        .from("company_formatting")
        .update(payload)
        .eq("company_id", selectedCompanyId));
    } else {
      ({ error } = await supabase.from("company_formatting").insert([payload]));
    }

    if (error) {
      toast.error("Erro ao guardar: " + error.message);
    } else {
      toast.success("Formatação guardada com sucesso!");
      setExists(true);
    }

    setSaving(false);
  };

  const handleReset = () => {
    setConfig({ ...DEFAULTS });
  };

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/empresas")}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="font-heading text-2xl font-bold text-foreground">Formatação de Atas</h1>
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <Label className="mb-2 block">Empresa</Label>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            A carregar empresas...
          </div>
        )}

        {selectedCompanyId && !loading && (
          <div className="space-y-6 animate-fade-in">
            <SectionCard
              title="Dados da Empresa na Ata"
              description="Informações usadas no cabeçalho e no corpo da ata."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome da Empresa</Label>
                  <Input
                    value={config.nome_empresa_ata}
                    onChange={(e) => updateField("nome_empresa_ata", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">NIF da Empresa</Label>
                  <Input
                    value={config.nif_empresa}
                    onChange={(e) => updateField("nif_empresa", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Morada da Empresa</Label>
                  <Input
                    value={config.morada_empresa}
                    onChange={(e) => updateField("morada_empresa", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Cabeçalho e Rodapé"
              description="Texto fixo no início e fim do Word exportado."
            >
              <div className="grid gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Cabeçalho</Label>
                  <Textarea
                    value={config.header_text}
                    onChange={(e) => updateField("header_text", e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rodapé</Label>
                  <Textarea
                    value={config.footer_text}
                    onChange={(e) => updateField("footer_text", e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Formato do Word"
              description="Estas opções passam a ser aplicadas quando exportas a ata em Word."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Fonte</Label>
                  <Select
                    value={config.font_family}
                    onValueChange={(value) => updateField("font_family", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Tamanho da letra (pt)</Label>
                  <Input
                    type="number"
                    min={8}
                    max={24}
                    step={0.5}
                    value={halfPtToPt(config.font_size ?? DEFAULTS.font_size ?? 22)}
                    onChange={(e) => updateField("font_size", ptToHalfPt(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Alinhamento do título</Label>
                  <Select
                    value={config.title_alignment}
                    onValueChange={(value) => updateField("title_alignment", value as FormattingConfig["title_alignment"])}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALIGNMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Alinhamento do texto</Label>
                  <Select
                    value={config.body_alignment}
                    onValueChange={(value) => updateField("body_alignment", value as FormattingConfig["body_alignment"])}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALIGNMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Margem Superior (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={twipsToCm(config.margin_top ?? DEFAULTS.margin_top ?? 1440)}
                    onChange={(e) => updateField("margin_top", cmToTwips(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Margem Inferior (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={twipsToCm(config.margin_bottom ?? DEFAULTS.margin_bottom ?? 1440)}
                    onChange={(e) => updateField("margin_bottom", cmToTwips(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Margem Esquerda (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={twipsToCm(config.margin_left ?? DEFAULTS.margin_left ?? 1440)}
                    onChange={(e) => updateField("margin_left", cmToTwips(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Margem Direita (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={twipsToCm(config.margin_right ?? DEFAULTS.margin_right ?? 1440)}
                    onChange={(e) => updateField("margin_right", cmToTwips(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Espaçamento de linha (twips)</Label>
                  <Input
                    type="number"
                    min={120}
                    max={480}
                    step={20}
                    value={config.line_spacing ?? DEFAULTS.line_spacing ?? 240}
                    onChange={(e) => updateField("line_spacing", parseInt(e.target.value) || 240)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Espaço após parágrafo (twips)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={480}
                    step={20}
                    value={config.paragraph_spacing_after ?? DEFAULTS.paragraph_spacing_after ?? 120}
                    onChange={(e) =>
                      updateField("paragraph_spacing_after", parseInt(e.target.value) || 0)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Avanço da 1ª linha (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={twipsToCm(config.first_line_indent ?? DEFAULTS.first_line_indent ?? 0)}
                    onChange={(e) => updateField("first_line_indent", cmToTwips(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Textos Base da Ata"
              description={`Estes textos passam a servir de base automática para ${selectedCompany?.name}. Podes usar placeholders como [percentagem], [nome presidente], [hora] e [minutos].`}
            >
              <div className="grid gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Texto antes das presenças</Label>
                  <Textarea
                    value={config.attendance_intro_text}
                    onChange={(e) => updateField("attendance_intro_text", e.target.value)}
                    className="mt-1 min-h-[90px]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Texto antes dos ausentes</Label>
                  <Textarea
                    value={config.absentees_intro_text}
                    onChange={(e) => updateField("absentees_intro_text", e.target.value)}
                    className="mt-1 min-h-[90px]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Texto legal antes dos pontos</Label>
                  <Textarea
                    value={config.legal_opening_text}
                    onChange={(e) => updateField("legal_opening_text", e.target.value)}
                    className="mt-1 min-h-[110px]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Texto de fecho</Label>
                  <Textarea
                    value={config.closing_text}
                    onChange={(e) => updateField("closing_text", e.target.value)}
                    className="mt-1 min-h-[110px]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Título da assinatura principal</Label>
                  <Input
                    value={config.signatures_title}
                    onChange={(e) => updateField("signatures_title", e.target.value)}
                    className="mt-1 max-w-sm"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Instruções Personalizadas para a IA"
              description="Regras adicionais de escrita, tom, vocabulário, estrutura e textos fixos desta empresa."
            >
              <div className="grid gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Introdução da secção de dívidas</Label>
                  <Textarea
                    value={config.debt_section_intro_text}
                    onChange={(e) => updateField("debt_section_intro_text", e.target.value)}
                    className="mt-1 min-h-[90px]"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Texto do total das dívidas</Label>
                    <Input
                      value={config.debt_total_label}
                      onChange={(e) => updateField("debt_total_label", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Texto da quota extra</Label>
                    <Input
                      value={config.debt_quota_extra_label}
                      onChange={(e) => updateField("debt_quota_extra_label", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Instruções adicionais para a IA</Label>
                  <Textarea
                    value={config.ai_custom_instructions}
                    onChange={(e) => updateField("ai_custom_instructions", e.target.value)}
                    className="min-h-[160px] mt-1"
                  />
                </div>
              </div>
            </SectionCard>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Repor Padrão
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Formatação
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminFormatacao;
