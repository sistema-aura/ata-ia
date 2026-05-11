import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { FileText, Palette, FileStack } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [atasCount, setAtasCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("atas")
        .select("*", { count: "exact", head: true });
      setAtasCount(count || 0);
    })();
  }, []);

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <h1 className="mb-8 font-heading text-3xl font-bold text-foreground">
          Painel de Administração
        </h1>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="mb-3 flex items-center gap-3">
              <FileStack className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold text-foreground">Atas Geradas</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{atasCount}</p>
          </div>

          <Link to="/admin/templates" className="rounded-lg border border-border bg-card p-6 shadow-document hover:border-accent transition">
            <div className="mb-3 flex items-center gap-3">
              <FileText className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold text-foreground">Templates</h3>
            </div>
            <p className="text-sm text-muted-foreground">Pontos padrão da ordem de trabalhos.</p>
          </Link>

          <Link to="/admin/formatacao" className="rounded-lg border border-border bg-card p-6 shadow-document hover:border-accent transition">
            <div className="mb-3 flex items-center gap-3">
              <Palette className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold text-foreground">Formatação</h3>
            </div>
            <p className="text-sm text-muted-foreground">Estilos, cabeçalhos e textos legais.</p>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
