import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { FileText, History, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { company } = useAuth();
  const [atasCount, setAtasCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!company) return;
      const { count: atas } = await supabase
        .from("atas")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);
      setAtasCount(atas || 0);
    };
    fetchCounts();
  }, [company]);

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">{company?.name}</p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="mb-2 flex items-center gap-3">
              <FileText className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold text-foreground">Atas Geradas</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{atasCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="mb-2 flex items-center gap-3">
              <History className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold text-foreground">Histórico</h3>
            </div>
            <p className="text-sm text-muted-foreground">Consulta todas as atas geradas.</p>
          </div>
        </div>

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
      </div>
    </AppLayout>
  );
};

export default Dashboard;
