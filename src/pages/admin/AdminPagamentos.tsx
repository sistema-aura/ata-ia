import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  company_id: string;
  amount: number;
  reference_month: string;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  companies?: { name: string };
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  paid: { label: "Pago", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  overdue: { label: "Em atraso", variant: "destructive" },
};

const AdminPagamentos = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // New payment form
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMonth, setFormMonth] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [formNotes, setFormNotes] = useState("");

  const fetchData = async () => {
    const [paymentsRes, companiesRes] = await Promise.all([
      supabase
        .from("payments")
        .select("*, companies(name)")
        .order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name").order("name"),
    ]);
    setPayments((paymentsRes.data as unknown as Payment[]) || []);
    setCompanies((companiesRes.data as Company[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formCompanyId || !formMonth) {
      toast.error("Preencha a empresa e o mês de referência");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("payments").insert([
      {
        company_id: formCompanyId,
        amount: parseFloat(formAmount) || 0,
        reference_month: formMonth,
        status: formStatus,
        paid_at: formStatus === "paid" ? new Date().toISOString() : null,
        notes: formNotes || "",
      },
    ]);
    if (error) {
      toast.error("Erro ao criar pagamento");
    } else {
      toast.success("Pagamento registado!");
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const toggleStatus = async (payment: Payment) => {
    const nextStatus =
      payment.status === "pending"
        ? "paid"
        : payment.status === "paid"
        ? "overdue"
        : "pending";

    const { error } = await supabase
      .from("payments")
      .update({
        status: nextStatus,
        paid_at: nextStatus === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", payment.id);

    if (error) {
      toast.error("Erro ao atualizar estado");
    } else {
      toast.success(`Estado alterado para ${STATUS_MAP[nextStatus]?.label}`);
      fetchData();
    }
  };

  const resetForm = () => {
    setFormCompanyId("");
    setFormAmount("");
    setFormMonth("");
    setFormStatus("pending");
    setFormNotes("");
  };

  const filtered = payments.filter((p) => {
    if (filterCompany !== "all" && p.company_id !== filterCompany) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle className="h-3.5 w-3.5" />;
    if (status === "overdue") return <XCircle className="h-3.5 w-3.5" />;
    return <Clock className="h-3.5 w-3.5" />;
  };

  // Generate month options (current + 11 past months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    return { val, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Pagamentos</h1>
          <Button
            className="gap-2"
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Registar Pagamento
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={filterCompany} onValueChange={setFilterCompany}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="overdue">Em atraso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhum pagamento registado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">
                    {p.companies?.name || "—"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground capitalize">
                      {(() => {
                        const [y, m] = p.reference_month.split("-");
                        const d = new Date(parseInt(y), parseInt(m) - 1);
                        return d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
                      })()}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      €{Number(p.amount).toFixed(2)}
                    </span>
                  </div>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>
                  )}
                  {p.paid_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pago em {new Date(p.paid_at).toLocaleDateString("pt-PT")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={STATUS_MAP[p.status]?.variant || "secondary"}
                    className="gap-1 cursor-pointer"
                    onClick={() => toggleStatus(p)}
                  >
                    {getStatusIcon(p.status)}
                    {STATUS_MAP[p.status]?.label || p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={formCompanyId} onValueChange={setFormCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mês de Referência</Label>
                <Select value={formMonth} onValueChange={setFormMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.val} value={m.val}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Em atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Observações sobre o pagamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AdminPagamentos;
