import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Euro,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

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

interface Company {
  id: string;
  name: string;
}

const AdminPagamentos = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Confirm status change
  const [confirmPayment, setConfirmPayment] = useState<Payment | null>(null);
  const [confirmNextStatus, setConfirmNextStatus] = useState<string>("");

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

  const requestStatusChange = (payment: Payment) => {
    const order = ["pending", "paid", "overdue"];
    const nextIdx = (order.indexOf(payment.status) + 1) % order.length;
    setConfirmPayment(payment);
    setConfirmNextStatus(order[nextIdx]);
  };

  const confirmStatusChange = async () => {
    if (!confirmPayment) return;
    const { error } = await supabase
      .from("payments")
      .update({
        status: confirmNextStatus,
        paid_at: confirmNextStatus === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", confirmPayment.id);

    if (error) {
      toast.error("Erro ao atualizar estado");
    } else {
      toast.success(`Estado alterado para ${STATUS_MAP[confirmNextStatus]?.label}`);
      fetchData();
    }
    setConfirmPayment(null);
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

  const formatMonth = (ref: string) => {
    const [y, m] = ref.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1);
    const label = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <AppLayout>
      <div className="container max-w-6xl py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Os pagamentos são gerados automaticamente a cada mês. Aqui geres apenas o estado.
          </p>
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
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                <button
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => { setFilterCompany("all"); setFilterStatus("all"); }}
                >
                  Limpar filtros
                </button>
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
                Os pagamentos são gerados automaticamente no início de cada mês.
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
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.pending;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.companies?.name || "—"}</TableCell>
                        <TableCell>{formatMonth(p.reference_month)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          €{Number(p.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo.variant}
                            className="gap-1 cursor-pointer select-none"
                            onClick={() => requestStatusChange(p)}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.paid_at ? new Date(p.paid_at).toLocaleDateString("pt-PT") : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {p.notes || "—"}
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

      {/* Status Change Confirmation */}
      <AlertDialog open={!!confirmPayment} onOpenChange={(open) => !open && setConfirmPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar estado do pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja alterar o estado de{" "}
              <strong>{confirmPayment?.companies?.name}</strong> ({confirmPayment ? formatMonth(confirmPayment.reference_month) : ""}) para{" "}
              <strong>{STATUS_MAP[confirmNextStatus]?.label}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AdminPagamentos;
