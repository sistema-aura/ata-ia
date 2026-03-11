import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PontoOrdemDia } from "@/types/ata";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Company {
  id: string;
  name: string;
  slug: string;
}

const AdminTemplates = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyIdParam = searchParams.get("company");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyIdParam || "");
  const [pontos, setPontos] = useState<PontoOrdemDia[]>([]);
  const [localReuniao, setLocalReuniao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateExists, setTemplateExists] = useState(false);

  useEffect(() => {
    supabase.from("companies").select("id, name, slug").order("name").then(({ data }) => {
      setCompanies((data as Company[]) || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) {
      setPontos([]);
      setLocalReuniao("");
      setTemplateExists(false);
      return;
    }
    loadTemplate(selectedCompanyId);
  }, [selectedCompanyId]);

  const loadTemplate = async (companyId: string) => {
    const { data } = await supabase
      .from("company_templates")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (data) {
      setPontos((data.pontos_padrao as unknown as PontoOrdemDia[]) || []);
      setLocalReuniao(data.local_reuniao_padrao || "");
      setTemplateExists(true);
    } else {
      setPontos([]);
      setLocalReuniao("");
      setTemplateExists(false);
    }
  };

  const addPonto = () => {
    setPontos((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        titulo: "",
        tipo: "padrao",
        descricaoPadrao: "",
      },
    ]);
  };

  const updatePonto = (index: number, updates: Partial<PontoOrdemDia>) => {
    setPontos((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  const removePonto = (index: number) => {
    setPontos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);

    const payload = {
      company_id: selectedCompanyId,
      pontos_padrao: JSON.parse(JSON.stringify(pontos)),
      local_reuniao_padrao: localReuniao,
    };

    let error;
    if (templateExists) {
      ({ error } = await supabase
        .from("company_templates")
        .update(payload)
        .eq("company_id", selectedCompanyId));
    } else {
      ({ error } = await supabase
        .from("company_templates")
        .insert([payload]));
    }

    if (error) {
      toast.error("Erro ao guardar template: " + error.message);
    } else {
      toast.success("Template guardado com sucesso!");
      setTemplateExists(true);
    }
    setSaving(false);
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <AppLayout>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/empresas")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Templates de Ata
          </h1>
        </div>

        {/* Company selector */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-6">
          <Label className="mb-2 block">Empresa</Label>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Selecione uma empresa" />
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

        {selectedCompanyId && (
          <div className="space-y-6 animate-fade-in">
            {/* Local de reunião padrão */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <Label className="mb-2 block">Local de Reunião Padrão</Label>
              <Input
                value={localReuniao}
                onChange={(e) => setLocalReuniao(e.target.value)}
                placeholder="Ex: Hall de entrada"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Será pré-preenchido ao criar uma nova ata
              </p>
            </div>

            {/* Pontos template */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    Pontos da Ordem de Trabalhos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Configure os pontos padrão que aparecerão ao criar uma nova ata para{" "}
                    <strong>{selectedCompany?.name}</strong>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addPonto} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Ponto
                </Button>
              </div>

              {pontos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Nenhum ponto configurado.</p>
                  <p className="text-sm">
                    Os utilizadores desta empresa verão um formulário vazio com placeholder "Ponto a desenvolver".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pontos.map((ponto, index) => (
                    <div
                      key={ponto.id}
                      className="rounded-md border border-border bg-background p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1 mt-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {index + 1}
                          </span>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Título do Ponto</Label>
                            <Input
                              value={ponto.titulo}
                              onChange={(e) => updatePonto(index, { titulo: e.target.value })}
                              placeholder="Ex: Apresentação e aprovação das contas"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Texto Padrão (será mostrado como referência ao utilizador)
                            </Label>
                            <Textarea
                              value={ponto.descricaoPadrao || ""}
                              onChange={(e) =>
                                updatePonto(index, { descricaoPadrao: e.target.value })
                              }
                              placeholder="Texto padrão para este ponto (opcional)"
                              className="mt-1 min-h-[80px] text-sm"
                            />
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePonto(index)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar Template
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminTemplates;
