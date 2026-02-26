import { useState } from "react";
import { AtaFormData, INITIAL_FORM_DATA, PontoOrdemDia } from "@/types/ata";
import { AssemblyInfoForm } from "@/components/AssemblyInfoForm";
import { PontosOrdemDiaForm } from "@/components/PontosOrdemDiaForm";
import { AtaPreview } from "@/components/AtaPreview";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [formData, setFormData] = useState<AtaFormData>(INITIAL_FORM_DATA);
  const [ataGerada, setAtaGerada] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<"form" | "preview">("form");

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
          body: JSON.stringify({ formData }),
        }
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
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                Atas<span className="text-gradient-gold">IA</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerador inteligente de atas de assembleia
              </p>
            </div>
          </div>
        </div>
      </header>

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

            <PontosOrdemDiaForm
              pontos={formData.pontosOrdemDia}
              updatePonto={updatePonto}
              addPonto={addPontoPersonalizado}
              removePonto={removePonto}
              observacoes={formData.observacoesAdicionais}
              onObservacoesChange={(v) => updateField("observacoesAdicionais", v)}
            />

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
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
