import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  ata: string;
  isGenerating: boolean;
  onBack: () => void;
}

export const AtaPreview = ({ ata, isGenerating, onBack }: Props) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(ata);
    toast.success("Ata copiada para a área de transferência!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao formulário
        </Button>
        {ata && !isGenerating && (
          <Button onClick={copyToClipboard} variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Copiar Ata
          </Button>
        )}
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
