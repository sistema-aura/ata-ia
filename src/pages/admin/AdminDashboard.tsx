import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Building2, Users, FileText, LifeBuoy } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ companies: 0, users: 0, atas: 0, tickets: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [companies, profiles, atas, tickets] = await Promise.all([
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("atas").select("*", { count: "exact", head: true }),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
      ]);
      setStats({
        companies: companies.count || 0,
        users: profiles.count || 0,
        atas: atas.count || 0,
        tickets: tickets.count || 0,
      });
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
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">
          Painel de Administração
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-border bg-card p-6 shadow-document">
              <div className="flex items-center gap-3 mb-3">
                <card.icon className="h-5 w-5 text-accent" />
                <h3 className="font-heading font-semibold text-foreground">{card.label}</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
