import { useEffect, useState } from "react";
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
import { ArrowLeft, Save, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Company {
  id: string;
  name: string;
}

interface FormattingConfig {
  font_family: string;
  font_size: number;
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  line_spacing: number;
  header_text: string;
  footer_text: string;
  ai_custom_instructions: string;
  nome_empresa_ata: string;
  nif_empresa: string;
  morada_empresa: string;
}

const DEFAULTS: FormattingConfig = {
  font_family: "Times New Roman",
  font_size: 22,
  margin_top: 1440,
  margin_bottom: 1440,
  margin_left: 1440,
  margin_right: 1440,
  line_spacing: 120,
  header_text: "",
  footer_text: "",
  ai_custom_instructions: "",
  nome_empresa_ata: "",
  nif_empresa: "",
  morada_empresa: "",
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

// Convert twips to cm for display (1 cm = 567 twips)
const twipsToCm = (twips: number) => (twips / 567).toFixed(1);
const cmToTwips = (cm: string) => Math.round(parseFloat(cm || "0") * 567);

// Convert half-points to pt for display (size 22 = 11pt)
const halfPtToPt = (hp: number) => (hp / 2).toString();
const ptToHalfPt = (pt: string) => Math.round(parseFloat(pt || "11") * 2);

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
    supabase.from("companies").select("id, name").order("name").then(({ data }) => {
      setCompanies((data as Company[]) || []);
      setLoading(false);
    });
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
      .single();

    if (data) {
      setConfig({
        font_family: data.font_family,
        font_size: data.font_size,
        margin_top: data.margin_top,
        margin_bottom: data.margin_bottom,
        margin_left: data.margin_left,
        margin_right: data.margin_right,
        line_spacing: data.line_spacing,
        header_text: data.header_text || "",
        footer_text: data.footer_text || "",
        ai_custom_instructions: data.ai_custom_instructions || "",
        nome_empresa_ata: data.nome_empresa_ata || "",
        nif_empresa: data.nif_empresa || "",
        morada_empresa: data.morada_empresa || "",
      });
      setExists(true);
    } else {
      setConfig({ ...DEFAULTS });
      setExists(false);
    }
  };

  const updateField = <K extends keyof FormattingConfig>(key: K, value: FormattingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);

    const payload = { company_id: selectedCompanyId, ...config };

    let error;
    if (exists) {
      ({ error } = await supabase
        .from("company_formatting")
        .update(payload)
        .eq("company_id", selectedCompanyId));
    } else {
      ({ error } = await supabase
        .from("company_formatting")
        .insert([payload]));
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

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <AppLayout>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/empresas")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Formatação de Atas
          </h1>
        </div>

        {/* Company selector */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-6">
          <Label className="mb-2 block">Empresa</Label>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCompanyId && (
          <div className="space-y-6 animate-fade-in">
            {/* Dados da empresa na ata */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
                Dados da Empresa na Ata
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Informações que aparecem no cabeçalho e corpo da ata
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome da Empresa</Label>
                  <Input
                    value={config.nome_empresa_ata}
                    onChange={(e) => updateField("nome_empresa_ata", e.target.value)}
                    placeholder="Ex: Condomínio Dinâmico, Lda."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">NIF da Empresa</Label>
                  <Input
                    value={config.nif_empresa}
                    onChange={(e) => updateField("nif_empresa", e.target.value)}
                    placeholder="Ex: 513 259 678"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Morada da Empresa</Label>
                  <Input
                    value={config.morada_empresa}
                    onChange={(e) => updateField("morada_empresa", e.target.value)}
                    placeholder="Ex: Rua X, Lisboa"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Cabeçalho e Rodapé */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
                Cabeçalho e Rodapé
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Texto fixo no início e fim de cada ata exportada
              </p>
              <div className="grid gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Cabeçalho</Label>
                  <Textarea
                    value={config.header_text}
                    onChange={(e) => updateField("header_text", e.target.value)}
                    placeholder="Texto que aparece no topo de cada ata (nome da empresa, logotipo textual, etc.)"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rodapé</Label>
                  <Textarea
                    value={config.footer_text}
                    onChange={(e) => updateField("footer_text", e.target.value)}
                    placeholder="Texto que aparece no final de cada ata (NIF, morada, contactos, etc.)"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Estilo do documento */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
                Estilo do Documento Word
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Configurações de fonte, tamanho e margens para a exportação Word
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Fonte</Label>
                  <Select
                    value={config.font_family}
                    onValueChange={(v) => updateField("font_family", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tamanho (pt)</Label>
                  <Input
                    type="number"
                    min={8}
                    max={24}
                    step={0.5}
                    value={halfPtToPt(config.font_size)}
                    onChange={(e) => updateField("font_size", ptToHalfPt(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4 mt-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Margem Superior (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={twipsToCm(config.margin_top)}
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
                    value={twipsToCm(config.margin_bottom)}
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
                    value={twipsToCm(config.margin_left)}
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
                    value={twipsToCm(config.margin_right)}
                    onChange={(e) => updateField("margin_right", cmToTwips(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-4 max-w-xs">
                <Label className="text-xs text-muted-foreground">Espaçamento entre linhas (twips)</Label>
                <Input
                  type="number"
                  min={60}
                  max={400}
                  step={20}
                  value={config.line_spacing}
                  onChange={(e) => updateField("line_spacing", parseInt(e.target.value) || 120)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Instruções para a IA */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
                Instruções Personalizadas para a IA
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Regras adicionais que a IA deve seguir ao redigir atas para{" "}
                <strong>{selectedCompany?.name}</strong> (tom, vocabulário, secções extra, etc.)
              </p>
              <Textarea
                value={config.ai_custom_instructions}
                onChange={(e) => updateField("ai_custom_instructions", e.target.value)}
                placeholder={`Ex:\n- Usar sempre o nome completo da empresa no cabeçalho\n- Incluir referência ao art.º 1436º do CC na eleição da administração\n- Tom mais formal nas deliberações`}
                className="min-h-[140px]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Repor Padrão
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
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
