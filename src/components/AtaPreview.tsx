import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Download, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { exportAtaToWord, WordFormattingConfig } from "@/lib/exportWord";

interface Props {
  ata: string;
  isGenerating: boolean;
  onBack: () => void;
  nomeCondominio?: string;
  dataAssembleia?: string;
  formData?: any;
  companyId?: string | null;
  wordFormatting?: WordFormattingConfig;
}

export const AtaPreview = ({ ata, isGenerating, onBack, nomeCondominio, dataAssembleia, formData, companyId, wordFormatting }: Props) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ata);
    toast.success("Ata copiada para a área de transferência!");
  };

  const saveAta = async () => {
    if (!ata) return;
    setSaving(true);
    const { error } = await supabase.from("atas").insert({
      nome_condominio: nomeCondominio || "Sem nome",
      data_assembleia: dataAssembleia || "",
      conteudo: ata,
      form_data: formData || null,
      company_id: companyId || null,
    });

    if (error) {
      toast.error("Erro ao guardar a ata");
      console.error(error);
    } else {
      toast.success("Ata guardada com sucesso!");
      setSaved(true);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao formulário
        </Button>
        <div className="flex gap-2">
          {ata && !isGenerating && (
            <>
              <Button onClick={copyToClipboard} variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                onClick={() => exportAtaToWord(ata, nomeCondominio, formData?.numeroAta, wordFormatting)}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Word
              </Button>
              <Button
                onClick={saveAta}
                disabled={saving || saved}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saved ? "Guardada" : saving ? "A guardar..." : "Guardar Ata"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="ata-document min-h-[400px]">
        {isGenerating && !ata && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent" />
            <p className="font-heading text-lg">A gerar a sua ata...</p>
            <p className="text-sm">A IA está a redigir o documento</p>
          </div>
        )}

        {ata && (
          <div className="prose prose-sm max-w-none text-foreground">
            <ReactMarkdown>{ata}</ReactMarkdown>
          </div>
        )}

        {!ata && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="font-heading text-lg">Nenhuma ata gerada ainda</p>
            <p className="text-sm">
              Preencha os dados e clique em "Gerar Ata com IA"
            </p>
          </div>
        )}

        {isGenerating && ata && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            A escrever...
          </div>
        )}
      </div>
    </div>
  );
};
