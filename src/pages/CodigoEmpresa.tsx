import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

const CodigoEmpresa = () => {
  const { company } = useAuth();

  const copyCompanyCode = async () => {
    if (!company?.slug) return;
    await navigator.clipboard.writeText(company.slug);
    toast.success("Código da empresa copiado");
  };

  return (
    <AppLayout>
      <div className="container max-w-3xl py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Código da empresa</h1>
          <p className="mt-2 text-muted-foreground">
            Partilhe este código com os funcionários para criarem conta.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-document">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-lg font-semibold text-foreground">{company?.name}</h2>
          </div>

          <div className="rounded-md border border-border bg-paper px-4 py-5">
            <p className="text-sm text-muted-foreground">Código atual</p>
            <p className="mt-2 break-all font-mono text-2xl font-semibold text-foreground">
              {company?.slug || "—"}
            </p>
          </div>

          <Button variant="outline" className="mt-4 gap-2" onClick={copyCompanyCode}>
            <Copy className="h-4 w-4" />
            Copiar código
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default CodigoEmpresa;