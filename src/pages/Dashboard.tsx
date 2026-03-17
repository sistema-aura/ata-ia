import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { FileText, History, LifeBuoy, Plus, AlertTriangle, Copy, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const { company, profile } = useAuth();
  const [atasCount, setAtasCount] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);

  const isBlocked = company && !company.is_active;

  const copyCompanyCode = async () => {
    if (!company?.slug) return;
    await navigator.clipboard.writeText(company.slug);
    toast.success("Código da empresa copiado");
  };

  useEffect(() => {
    const fetchCounts = async () => {
      if (!company) return;
      const { count: atas } = await supabase
        .from("atas")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);
      setAtasCount(atas || 0);

      const { count: tickets } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id)
        .in("status", ["open", "in_progress"]);
      setTicketsCount(tickets || 0);
    };
    fetchCounts();
  }, [company]);

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Bem-vindo, {profile?.full_name || ""}
          </h1>
          <p className="mt-1 text-muted-foreground">{company?.name}</p>
        </div>

        {company?.slug && (
          <div className="mb-8 rounded-lg border border-border bg-card p-5 shadow-document">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-semibold text-foreground">Código da empresa</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Partilhe este código com os funcionários para criarem conta.
                </p>
                <p className="mt-2 font-mono text-lg font-semibold text-foreground">{company.slug}</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={copyCompanyCode}>
                <Copy className="h-4 w-4" />
                Copiar código
              </Button>
            </div>
          </div>
        )}

        {isBlocked && (
          <div className="mb-8 flex items-start gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
            <div>
              <h2 className="font-heading text-lg font-semibold text-destructive">
                Acesso Limitado
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                O acesso da sua empresa está temporariamente suspenso. As funcionalidades de criação de atas e histórico estão indisponíveis.
              </p>
              {company.blocked_reason && (
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong>Motivo:</strong> {company.blocked_reason}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Entre em contacto com o suporte para resolver esta situação.
              </p>
              <Link to="/suporte" className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="gap-2">
                  <LifeBuoy className="h-4 w-4" /> Contactar Suporte
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="mb-2 flex items-center gap-3">
              <FileText className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold text-foreground">Atas Geradas</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{atasCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="mb-2 flex items-center gap-3">
              <LifeBuoy className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold text-foreground">Tickets Abertos</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{ticketsCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="mb-2 flex items-center gap-3">
              <History className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold text-foreground">Estado</h3>
            </div>
            <p className={`text-lg font-semibold ${company?.is_active ? "text-emerald-600" : "text-destructive"}`}>
              {company?.is_active ? "Ativo" : "Bloqueado"}
            </p>
          </div>
        </div>

        {!isBlocked && (
          <div className="flex gap-4">
            <Link to="/nova-ata">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Ata
              </Button>
            </Link>
            <Link to="/historico">
              <Button variant="outline" className="gap-2">
                <History className="h-4 w-4" />
                Ver Histórico
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
