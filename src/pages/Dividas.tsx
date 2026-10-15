import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CondominioCombobox, Condominio } from "@/components/CondominioCombobox";
import { PdfUpload } from "@/components/PdfUpload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buildDebtText, DebtFormatting, DebtWarning, fmtMoney } from "@/lib/debtText";
import { DividasData } from "@/types/ata";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Download, AlertTriangle, Wallet } from "lucide-react";

const Dividas = () => {
  const [nomeCondominio, setNomeCondominio] = useState("");
  const [condominio, setCondominio] = useState<Condominio | null>(null);
  const [dividasData, setDividasData] = useState<DividasData | null>(null);
  const [texto, setTexto] = useState("");
  const [warnings, setWarnings] = useState<DebtWarning[]>([]);
  const [parsed, setParsed] = useState(false);
  const [fmt, setFmt] = useState<DebtFormatting>({});

  useEffect(() => {
    supabase
      .from("company_formatting")
      .select("debt_section_intro_text, debt_total_label")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFmt(data as DebtFormatting);
      });
  }, []);

  const handleParsed = (data: DividasData) => {
    setDividasData(data);
    const { text, warnings } = buildDebtText(data, fmt);
    setTexto(text);
    setWarnings(warnings);
    setParsed(true);
  };

  const limpar = () => {
    setDividasData(null);
    setTexto("");
    setWarnings([]);
    setParsed(false);
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    toast.success("Texto copiado para a área de transferência");
  };

  const descarregarWord = () => {
    const blob = new Blob(
      [
        `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Dívidas</title></head><body style="font-family:'Times New Roman',serif;font-size:12pt;">`,
        ...texto.split("\n").map((l) => `<p style="margin:0 0 6pt 0;">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;") || "&nbsp;"}</p>`),
        `</body></html>`,
      ],
      { type: "application/msword" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dividas-${(condominio?.nome || nomeCondominio || "condominio").replace(/[^\w]+/g, "_")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dívidas</h1>
          <p className="text-sm text-muted-foreground">
            Gere apenas a secção de dívidas para completar uma ata antiga. Escolha o prédio e carregue o mapa de dívidas.
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-document">
          <div className="space-y-2">
            <Label>Prédio / Condomínio</Label>
            <CondominioCombobox
              value={nomeCondominio}
              onChange={setNomeCondominio}
              onSelect={setCondominio}
              placeholder="Comece a escrever o nome do prédio..."
            />
          </div>

          <PdfUpload
            label="Mapa de Dívidas"
            description="PDF com os valores em dívida"
            parseType="dividas"
            onParsed={handleParsed}
            isParsed={parsed}
            onClear={limpar}
          />
        </div>

        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-4 dark:bg-amber-950/20">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                Verifique estas frações antes de usar o texto
              </p>
            </div>
            <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
              {warnings.map((w, i) => (
                <li key={i}>
                  Fração {w.fracao}: total lido € {fmtMoney(w.totalLido)} mas a soma dos itens é € {fmtMoney(w.totalCalculado)} (diferença de € {fmtMoney(Math.abs(w.diferenca))})
                </li>
              ))}
            </ul>
          </div>
        )}

        {texto && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-accent" />
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Texto das dívidas
                </h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copiar}>
                  <Copy className="mr-1 h-4 w-4" />Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={descarregarWord}>
                  <Download className="mr-1 h-4 w-4" />Descarregar Word
                </Button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-4 font-body text-sm text-foreground">
              {texto}
            </pre>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dividas;
