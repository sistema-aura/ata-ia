import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  created_at: string;
}

const AdminUtilizadores = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setProfiles((data as Profile[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Utilizadores</h1>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
        ) : (
          <div className="space-y-3">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm">
                <div>
                  <h3 className="font-medium text-foreground">{p.full_name || "Sem nome"}</h3>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.company_id ? "default" : "secondary"}>
                    {p.company_id ? "Com empresa" : "Sem empresa"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminUtilizadores;
