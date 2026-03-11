import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save, Euro } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  monthly_price: number;
  is_active: boolean;
}

const AdminPrecos = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from("companies")
      .select("id, name, monthly_price, is_active")
      .order("name");
    setCompanies((data as unknown as Company[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handlePriceChange = (companyId: string, value: string) => {
    setEditedPrices((prev) => ({ ...prev, [companyId]: value }));
  };

  const savePrice = async (company: Company) => {
    const newPrice = parseFloat(editedPrices[company.id] ?? String(company.monthly_price));
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Valor inválido");
      return;
    }
    setSaving(company.id);
    const { error } = await supabase
      .from("companies")
      .update({ monthly_price: newPrice })
      .eq("id", company.id);

    if (error) {
      toast.error("Erro ao guardar preço");
    } else {
      toast.success(`Preço de ${company.name} atualizado para €${newPrice.toFixed(2)}`);
      setEditedPrices((prev) => {
        const next = { ...prev };
        delete next[company.id];
        return next;
      });
      fetchCompanies();
    }
    setSaving(null);
  };

  const saveAll = async () => {
    const ids = Object.keys(editedPrices);
    if (ids.length === 0) {
      toast.info("Nenhuma alteração para guardar");
      return;
    }
    setSaving("all");
    let hasError = false;
    for (const id of ids) {
      const newPrice = parseFloat(editedPrices[id]);
      if (isNaN(newPrice) || newPrice < 0) continue;
      const { error } = await supabase
        .from("companies")
        .update({ monthly_price: newPrice })
        .eq("id", id);
      if (error) hasError = true;
    }
    if (hasError) {
      toast.error("Alguns preços não foram guardados");
    } else {
      toast.success("Todos os preços foram atualizados!");
    }
    setEditedPrices({});
    fetchCompanies();
    setSaving(null);
  };

  const totalMonthly = companies.reduce((sum, c) => sum + Number(c.monthly_price), 0);
  const activeWithPrice = companies.filter((c) => c.is_active && c.monthly_price > 0).length;

  return (
    <AppLayout>
      <div className="container max-w-4xl py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Preços</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Define o valor mensal de cada empresa
            </p>
          </div>
          {Object.keys(editedPrices).length > 0 && (
            <Button onClick={saveAll} disabled={saving === "all"} className="gap-2">
              {saving === "all" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Tudo ({Object.keys(editedPrices).length})
            </Button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Euro className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita Mensal Prevista</p>
                  <p className="text-xl font-bold text-foreground">€{totalMonthly.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <Euro className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Empresas com Preço</p>
                  <p className="text-xl font-bold text-foreground">{activeWithPrice} / {companies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[180px]">Preço Mensal (€)</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => {
                    const currentValue = editedPrices[c.id] ?? String(c.monthly_price);
                    const isEdited = c.id in editedPrices && editedPrices[c.id] !== String(c.monthly_price);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${c.is_active ? "text-emerald-600" : "text-destructive"}`}>
                            {c.is_active ? "Ativo" : "Bloqueado"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={currentValue}
                            onChange={(e) => handlePriceChange(c.id, e.target.value)}
                            className="h-9 w-[150px] tabular-nums"
                          />
                        </TableCell>
                        <TableCell>
                          {isEdited && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => savePrice(c)}
                              disabled={saving === c.id}
                            >
                              {saving === c.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
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
    </AppLayout>
  );
};

export default AdminPrecos;
