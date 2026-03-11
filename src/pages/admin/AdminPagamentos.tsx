import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Euro,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
} from "lucide-react";
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

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle }
> = {
  paid: { label: "Pago", variant: "default", icon: CheckCircle },
  pending: { label: "Pendente", variant: "secondary", icon: Clock },
  overdue: { label: "Em atraso", variant: "destructive", icon: AlertTriangle },
};

const AdminPagamentos = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Filter
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form
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
        .order("reference_month", { ascending: false }),
      supabase.from("companies").select("id, name").order("name"),
    ]);
    setPayments((paymentsRes.data as unknown as Payment[]) || []);
    setCompanies((companiesRes.data as Company[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingPayment(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (p: Payment) => {
    setEditingPayment(p);
    setFormCompanyId(p.company_id);
    setFormAmount(String(p.amount));
    setFormMonth(p.reference_month);
    setFormStatus(p.status);
    setFormNotes(p.notes || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formCompanyId || !formMonth) {
      toast.error("Preencha a empresa e o mês de referência");
      return;
    }
    setSaving(true);

    const payload = {
      company_id: formCompanyId,
      amount: parseFloat(formAmount) || 0,
      reference_month: formMonth,
      status: formStatus,
      paid_at: formStatus === "paid" ? new Date().toISOString() : null,
      notes: formNotes || "",
    };

    const { error } = editingPayment
      ? await supabase.from("payments").update(payload).eq("id", editingPayment.id)
      : await supabase.from("payments").insert([payload]);

    if (error) {
      toast.error(editingPayment ? "Erro ao atualizar pagamento" : "Erro ao criar pagamento");
    } else {
      toast.success(editingPayment ? "Pagamento atualizado!" : "Pagamento registado!");
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que quer eliminar este pagamento?")) return;
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao eliminar pagamento");
    } else {
      toast.success("Pagamento eliminado");
      fetchData();
    }
  };

  const toggleStatus = async (payment: Payment) => {
    const order = ["pending", "paid", "overdue"];
    const nextIdx = (order.indexOf(payment.status) + 1) % order.length;
    const nextStatus = order[nextIdx];

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
    setEditingPayment(null);
  };

  const filtered = payments.filter((p) => {
    if (filterCompany !== "all" && p.company_id !== filterCompany) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  // Summary stats
  const totalReceived = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOverdue = payments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const overdueCount = payments.filter((p) => p.status === "overdue").length;

  const formatMonth = (ref: string) => {
    const [y, m] = ref.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1);
    const label = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
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
      <div className="container max-w-6xl py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Pagamentos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestão e controlo de faturação por empresa
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Registar Pagamento
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <Euro className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recebido</p>
                  <p className="text-xl font-bold text-foreground">€{totalReceived.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2.5">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendente</p>
                  <p className="text-xl font-bold text-foreground">€{totalPending.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em Atraso</p>
                  <p className="text-xl font-bold text-foreground">€{totalOverdue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Registos</p>
                  <p className="text-xl font-bold text-foreground">{payments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="w-[220px]">
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Em atraso</SelectItem>
                </SelectContent>
              </Select>
              {(filterCompany !== "all" || filterStatus !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    setFilterCompany("all");
                    setFilterStatus("all");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Euro className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum pagamento encontrado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Registe o primeiro pagamento clicando no botão acima.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Mês de Referência</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.pending;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.companies?.name || "—"}
                        </TableCell>
                        <TableCell>{formatMonth(p.reference_month)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          €{Number(p.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo.variant}
                            className="gap-1 cursor-pointer select-none"
                            onClick={() => toggleStatus(p)}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.paid_at
                            ? new Date(p.paid_at).toLocaleDateString("pt-PT")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {p.notes || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(p)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Editar Pagamento" : "Registar Pagamento"}
            </DialogTitle>
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
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPayment ? "Guardar" : "Registar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AdminPagamentos;
