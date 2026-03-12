import { useState, useEffect } from "react";
import { AtaFormData, getDefaultFormData, PontoOrdemDia, PresencasData, DividasData, CompanyTemplate, PONTO_VAZIO } from "@/types/ata";
import { WordFormattingConfig } from "@/lib/exportWord";
import { AssemblyInfoForm } from "@/components/AssemblyInfoForm";
import { PontosOrdemDiaForm } from "@/components/PontosOrdemDiaForm";
import { AtaPreview } from "@/components/AtaPreview";
import { PdfUpload } from "@/components/PdfUpload";
import { FileText, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const NovaAta = () => {
  const { company } = useAuth();
  const [formData, setFormData] = useState<AtaFormData>(getDefaultFormData());
  const [ataGerada, setAtaGerada] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<"form" | "preview">("form");
  const [ordemDiaParsed, setOrdemDiaParsed] = useState(false);
  const [presencasParsed, setPresencasParsed] = useState(false);
  const [dividasParsed, setDividasParsed] = useState(false);
  const [template, setTemplate] = useState<CompanyTemplate | null>(null);
  const [wordFormatting, setWordFormatting] = useState<WordFormattingConfig | undefined>(undefined);

  useEffect(() => {
    if (!company?.id) return;
    const loadCompanyConfig = async () => {
      // Load template
      const { data: tData } = await supabase
        .from("company_templates")
        .select("*")
        .eq("company_id", company.id)
        .single();

      if (tData) {
        const t: CompanyTemplate = {
          id: tData.id,
          company_id: tData.company_id,
          pontos_padrao: (tData.pontos_padrao as unknown as PontoOrdemDia[]) || [],
          local_reuniao_padrao: tData.local_reuniao_padrao || "",
          presidente_mesa_padrao: tData.presidente_mesa_padrao || "",
        };
        setTemplate(t);
        setFormData(getDefaultFormData(t));
      }

      // Load formatting
      const { data: fData } = await supabase
        .from("company_formatting")
        .select("*")
        .eq("company_id", company.id)
        .single();

      if (fData) {
        setWordFormatting({
          font_family: fData.font_family,
          font_size: fData.font_size,
          margin_top: fData.margin_top,
          margin_bottom: fData.margin_bottom,
          margin_left: fData.margin_left,
          margin_right: fData.margin_right,
          line_spacing: fData.line_spacing,
          header_text: fData.header_text || "",
          footer_text: fData.footer_text || "",
        });
      }
    };
    loadCompanyConfig();
  }, [company?.id]);

  const updateField = (field: keyof AtaFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePonto = (index: number, updates: Partial<PontoOrdemDia>) => {
    setFormData((prev) => ({
      ...prev,
      pontosOrdemDia: prev.pontosOrdemDia.map((p, i) =>
        i === index ? { ...p, ...updates } : p
      ),
    }));
  };

  const addPontoPersonalizado = () => {
    setFormData((prev) => ({
      ...prev,
      pontosOrdemDia: [
        ...prev.pontosOrdemDia,
        {
          id: `custom-${Date.now()}`,
          titulo: "",
          tipo: "personalizado" as const,
          notas: "",
        },
      ],
    }));
  };

  const removePonto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pontosOrdemDia: prev.pontosOrdemDia.filter((_, i) => i !== index),
    }));
  };

  const handleOrdemDiaParsed = (data: { titulo: string }[]) => {
    if (!Array.isArray(data)) return;
    const pontos: PontoOrdemDia[] = data.map((p, i) => ({
      id: `pdf-${i}`,
      titulo: p.titulo,
      tipo: "personalizado" as const,
      notas: "",
    }));
    setFormData((prev) => ({ ...prev, pontosOrdemDia: pontos }));
    setOrdemDiaParsed(true);
  };

  const handlePresencasParsed = (data: PresencasData) => {
    setFormData((prev) => ({
      ...prev,
      presencasData: data,
      fracoesPresentes: String(data.presentes?.length || ""),
      fracoesRepresentadas: String(
        data.presentes?.filter((c) => c.representado).length || "0"
      ),
      percentagemPresente: data.totalPermilagem || "",
    }));
    setPresencasParsed(true);
  };

  const handleDividasParsed = (data: DividasData) => {
    setFormData((prev) => ({ ...prev, dividasData: data }));
    setDividasParsed(true);
  };

  const getResetPontos = () => {
    if (template?.pontos_padrao && template.pontos_padrao.length > 0) {
      return template.pontos_padrao.map((p) => ({ ...p }));
    }
    return [{ ...PONTO_VAZIO }];
  };

  const generateAta = async () => {
    if (!formData.nomeCondominio || !formData.dataAssembleia) {
      toast.error("Preencha pelo menos o nome do condomínio e a data da assembleia.");
      return;
    }

    setIsGenerating(true);
    setAtaGerada("");
    setActiveStep("preview");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ formData: { ...formData, companyId: company?.id } }),
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.error || "Erro ao gerar ata");
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAtaGerada(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      toast.success("Ata gerada com sucesso!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao gerar a ata");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout>
      {/* Step Tabs */}
      <div className="border-b border-border bg-card/50">
        <div className="container max-w-5xl">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveStep("form")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeStep === "form"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Dados da Assembleia
            </button>
            <button
              onClick={() => setActiveStep("preview")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeStep === "preview"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Ata Gerada
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container max-w-5xl py-8">
        {activeStep === "form" ? (
          <div className="space-y-8 animate-fade-in">
            <AssemblyInfoForm formData={formData} updateField={updateField} />

            {/* PDF Uploads */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-document">
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
                Documentos PDF
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <PdfUpload
                  label="Ordem de Trabalhos"
                  description="PDF com os pontos da ordem de trabalhos"
                  parseType="ordem_dia"
                  onParsed={handleOrdemDiaParsed}
                  isParsed={ordemDiaParsed}
                  onClear={() => {
                    setOrdemDiaParsed(false);
                    setFormData((prev) => ({
                      ...prev,
                      pontosOrdemDia: getResetPontos(),
                    }));
                  }}
                />
                <PdfUpload
                  label="Folha de Presenças"
                  description="PDF ou foto da folha de presenças"
                  parseType="presencas"
                  onParsed={handlePresencasParsed}
                  isParsed={presencasParsed}
                  onClear={() => {
                    setPresencasParsed(false);
                    setFormData((prev) => ({
                      ...prev,
                      presencasData: null,
                      fracoesPresentes: "",
                      fracoesRepresentadas: "",
                      percentagemPresente: "",
                    }));
                  }}
                />
                <PdfUpload
                  label="Mapa de Dívidas"
                  description="PDF com os valores em dívida"
                  parseType="dividas"
                  onParsed={handleDividasParsed}
                  isParsed={dividasParsed}
                  onClear={() => {
                    setDividasParsed(false);
                    setFormData((prev) => ({ ...prev, dividasData: null }));
                  }}
                />
              </div>
            </div>

            <PontosOrdemDiaForm
              pontos={formData.pontosOrdemDia}
              updatePonto={updatePonto}
              addPonto={addPontoPersonalizado}
              removePonto={removePonto}
              observacoes={formData.observacoesAdicionais}
              onObservacoesChange={(v) => updateField("observacoesAdicionais", v)}
            />

            {/* Presences preview */}
            {formData.presencasData && (
              <div className="rounded-lg border border-border bg-card p-6 shadow-document">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    Presenças Extraídas
                  </h2>
                </div>
                {formData.presencasData.presentes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-medium text-foreground">
                      Presentes ({formData.presencasData.presentes.length})
                    </h3>
                    <div className="space-y-1">
                      {formData.presencasData.presentes.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-1.5 text-sm"
                        >
                          <span className="font-medium text-foreground">{c.fracao}</span>
                          <span className="text-muted-foreground">{c.nome}</span>
                          {c.representado && (
                            <span className="text-xs text-accent">(representado)</span>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground">{c.permilagem}‰</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {formData.presencasData.ausentes.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-foreground">
                      Ausentes ({formData.presencasData.ausentes.length})
                    </h3>
                    <div className="space-y-1">
                      {formData.presencasData.ausentes.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-1.5 text-sm opacity-60"
                        >
                          <span className="font-medium text-foreground">{c.fracao}</span>
                          <span className="text-muted-foreground">{c.nome}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{c.permilagem}‰</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dividas preview */}
            {formData.dividasData && formData.dividasData.dividas.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6 shadow-document">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    Dívidas Extraídas
                  </h2>
                </div>
                <div className="space-y-1">
                  {formData.dividasData.dividas.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium text-foreground">{d.fracao}</span>
                      <span className="text-muted-foreground">{d.nome}</span>
                      {d.mesesAtraso && (
                        <span className="text-xs text-muted-foreground">({d.mesesAtraso} meses)</span>
                      )}
                      <span className="ml-auto font-medium text-destructive">{d.valorDivida}€</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end border-t border-border pt-2">
                  <span className="text-sm font-semibold text-foreground">
                    Total: {formData.dividasData.totalDivida}€
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={generateAta}
                disabled={isGenerating}
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "A gerar ata..." : "Gerar Ata com IA"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <AtaPreview
              ata={ataGerada}
              isGenerating={isGenerating}
              onBack={() => setActiveStep("form")}
              nomeCondominio={formData.nomeCondominio}
              dataAssembleia={formData.dataAssembleia}
              formData={formData}
              companyId={company?.id}
              wordFormatting={wordFormatting}
            />
          </div>
        )}
      </main>
    </AppLayout>
  );
};

export default NovaAta;
