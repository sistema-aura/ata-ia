import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Building2, Users, FileText, LifeBuoy, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CompanyCodeItem {
  id: string;
  name: string;
  slug: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({ companies: 0, users: 0, atas: 0, tickets: 0 });
  const [companyCodes, setCompanyCodes] = useState<CompanyCodeItem[]>([]);

  const copyCompanyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Código da empresa copiado");
  };

  useEffect(() => {
    const fetchStats = async () => {
      const [companies, profiles, atas, tickets, companiesList] = await Promise.all([
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("atas").select("*", { count: "exact", head: true }),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("companies").select("id, name, slug").order("name"),
      ]);

      setStats({
        companies: companies.count || 0,
        users: profiles.count || 0,
        atas: atas.count || 0,
        tickets: tickets.count || 0,
      });
      setCompanyCodes((companiesList.data as CompanyCodeItem[] | null) || []);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Empresas", value: stats.companies, icon: Building2 },
    { label: "Utilizadores", value: stats.users, icon: Users },
    { label: "Atas Geradas", value: stats.atas, icon: FileText },
    { label: "Tickets Abertos", value: stats.tickets, icon: LifeBuoy },
  ];

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <h1 className="mb-8 font-heading text-3xl font-bold text-foreground">
          Painel de Administração
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-border bg-card p-6 shadow-document">
              <div className="mb-3 flex items-center gap-3">
                <card.icon className="h-5 w-5 text-accent" />
                <h3 className="font-heading font-semibold text-foreground">{card.label}</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-document">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <h2 className="font-heading text-lg font-semibold text-foreground">Códigos das empresas</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Estes códigos podem ser enviados aos funcionários para criarem conta.
          </p>

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

export default AdminDashboard;
