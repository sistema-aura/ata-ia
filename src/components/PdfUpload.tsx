import { useRef, useState } from "react";
import { Upload, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  label: string;
  description: string;
  parseType: "ordem_dia" | "presencas";
  onParsed: (data: any) => void;
  isParsed: boolean;
  onClear: () => void;
}

export const PdfUpload = ({
  label,
  description,
  parseType,
  onParsed,
  isParsed,
  onClear,
}: Props) => {
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      toast.error("Por favor envie um ficheiro PDF ou imagem.");
      return;
    }

    setIsParsing(true);
    setFileName(file.name);

    try {
      const base64 = await fileToBase64(file);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            fileBase64: base64,
            fileType: file.type,
            parseType,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        throw new Error(err?.error || "Erro ao processar documento");
      }

      const { data } = await resp.json();
      onParsed(data);
      toast.success("Documento processado com sucesso!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao processar o documento");
      setFileName("");
    } finally {
      setIsParsing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
        isParsed
          ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
          : "border-border hover:border-accent/50 hover:bg-muted/30"
      }`}
    >
      {isParsing ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">
            A processar <span className="font-medium">{fileName}</span>...
          </p>
        </div>
      ) : isParsed ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{fileName} — processado</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClear();
              setFileName("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {parseType === "ordem_dia" ? (
              <FileText className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}
    </div>
  );
};
