import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface CompanyCodeItem {
  id: string;
  name: string;
  slug: string;
}

const AdminCodigosEmpresa = () => {
  const [companyCodes, setCompanyCodes] = useState<CompanyCodeItem[]>([]);

  const copyCompanyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Código da empresa copiado");
  };

  useEffect(() => {
    const fetchCompanyCodes = async () => {
      const { data } = await supabase.from("companies").select("id, name, slug").order("name");
      setCompanyCodes((data as CompanyCodeItem[] | null) || []);
    };

    fetchCompanyCodes();
  }, []);

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Códigos das empresas</h1>
          <p className="mt-2 text-muted-foreground">
            Envie estes códigos aos funcionários para criarem conta.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-document">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-lg font-semibold text-foreground">Lista de códigos</h2>
          </div>

          <div className="space-y-3">
            {companyCodes.map((company) => (
              <div
                key={company.id}
                className="flex flex-col gap-3 rounded-md border border-border px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{company.name}</p>
                  <p className="font-mono text-sm text-muted-foreground">{company.slug}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => copyCompanyCode(company.slug)}>
                  <Copy className="h-4 w-4" />
                  Copiar código
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminCodigosEmpresa;