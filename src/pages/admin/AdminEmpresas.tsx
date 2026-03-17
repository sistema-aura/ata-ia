import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Ban, CheckCircle, Loader2, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  blocked_reason: string | null;
  subscription_status: string | null;
  monthly_price: number;
  created_at: string;
}

const AdminEmpresas = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; companyId: string; companyName: string }>({
    open: false,
    companyId: "",
    companyName: "",
  });
  const [deletingCompany, setDeletingCompany] = useState(false);

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    setCompanies((data as Company[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const createCompany = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    const { data, error } = await supabase.from("companies").insert({ name: newName, slug, monthly_price: parseFloat(newPrice) || 0 }).select().single();
    if (error) {
      toast.error("Erro ao criar empresa: " + error.message);
      setCreating(false);
      return;
    }

    // If email provided, update that user's profile
    if (newEmail.trim() && data) {
      const { data: profileData } = await supabase.from("profiles").select("id").eq("email", newEmail.trim()).single();
      if (profileData) {
        await supabase.from("profiles").update({ company_id: data.id }).eq("id", profileData.id);
        await supabase.from("user_roles").upsert({ user_id: profileData.id, role: "company_user" as any });
      }
    }

    toast.success("Empresa criada com sucesso!");
    setNewName("");
    setNewEmail("");
    setNewPrice("");
    setDialogOpen(false);
    setCreating(false);
    fetchCompanies();
  };

  const toggleBlock = async (company: Company) => {
    if (company.is_active) {
      // Block
      setBlockingId(company.id);
    } else {
      // Unblock
      const { error } = await supabase.from("companies").update({ is_active: true, blocked_reason: null }).eq("id", company.id);
      if (error) toast.error("Erro ao desbloquear");
      else { toast.success("Empresa desbloqueada!"); fetchCompanies(); }
    }
  };

  const confirmBlock = async () => {
    if (!blockingId) return;
    const { error } = await supabase.from("companies").update({ is_active: false, blocked_reason: blockReason || "Falta de pagamento" }).eq("id", blockingId);
    if (error) toast.error("Erro ao bloquear");
    else { toast.success("Empresa bloqueada!"); fetchCompanies(); }
    setBlockingId(null);
    setBlockReason("");
  };

  const handleDeleteCompany = async () => {
    setDeletingCompany(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete_company", companyId: deleteDialog.companyId },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Erro ao eliminar empresa");
    } else {
      toast.success("Empresa eliminada com sucesso");
      setDeleteDialog({ open: false, companyId: "", companyName: "" });
      fetchCompanies();
    }

    setDeletingCompany(false);
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Gestão de Empresas</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Empresa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Empresa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Condomínio Dinâmico" />
                </div>
                <div className="space-y-2">
                  <Label>Email do utilizador (opcional)</Label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@empresa.com" type="email" />
                  <p className="text-xs text-muted-foreground">Se o utilizador já tiver conta, será associado à empresa.</p>
                </div>
                <div className="space-y-2">
                  <Label>Preço Mensal (€)</Label>
                  <Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" />
                  <p className="text-xs text-muted-foreground">Valor usado na geração automática de pagamentos.</p>
                </div>
                <Button onClick={createCompany} disabled={creating} className="w-full">
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Empresa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Block confirmation dialog */}
        <Dialog open={!!blockingId} onOpenChange={() => setBlockingId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Bloquear Empresa</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Motivo do bloqueio</Label>
                <Textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ex: Falta de pagamento" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBlockingId(null)} className="flex-1">Cancelar</Button>
                <Button variant="destructive" onClick={confirmBlock} className="flex-1">Confirmar Bloqueio</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => (
              <div key={company.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{company.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={company.is_active ? "default" : "destructive"}>
                      {company.is_active ? "Ativo" : "Bloqueado"}
                    </Badge>
                    {company.monthly_price > 0 && (
                      <span className="text-xs font-medium text-foreground">€{company.monthly_price}/mês</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Criada em {new Date(company.created_at).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                  {company.blocked_reason && (
                    <p className="text-xs text-destructive mt-1">{company.blocked_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/admin/templates?company=${company.id}`)}>
                    <FileText className="h-3 w-3" /> Templates
                  </Button>
                  <Button variant={company.is_active ? "destructive" : "default"} size="sm" className="gap-2" onClick={() => toggleBlock(company)}>
                    {company.is_active ? <><Ban className="h-3 w-3" /> Bloquear</> : <><CheckCircle className="h-3 w-3" /> Desbloquear</>}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => setDeleteDialog({ open: true, companyId: company.id, companyName: company.name })}
                  >
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminEmpresas;
