import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, FileText, Plus, Search, Sparkles, Trash2, Loader2 } from "lucide-react";

type Assembleia = {
  id: string;
  nome_condominio: string;
  nif: string | null;
  data_assembleia: string | null;
  hora: string | null;
  tipo: string | null;
  convocatoria: string | null;
  local_reuniao: string | null;
  notas: string | null;
  ficheiro_path: string | null;
  ficheiro_nome: string | null;
};

const vazio = {
  nome_condominio: "", nif: "", data_assembleia: "", hora: "",
  tipo: "ordinaria", convocatoria: "primeira", local_reuniao: "", notas: "",
};

const db = supabase as any;

const Assembleias = () => {
  const navigate = useNavigate();
  const [lista, setLista] = useState<Assembleia[]>([]);
  const [form, setForm] = useState(vazio);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");

  const filtro = pesquisa.trim().toLowerCase();
  const listaFiltrada = lista.filter((a) => {
    if (!filtro) return true;
    const nome = (a.nome_condominio || "").toLowerCase();
    const dataPt = a.data_assembleia ? new Date(a.data_assembleia).toLocaleDateString("pt-PT") : "";
    const dataIso = a.data_assembleia || "";
    return nome.includes(filtro) || dataPt.includes(filtro) || dataIso.includes(filtro);
  });

  const load = async () => {
    const { data } = await db.from("assembleias").select("*").order("data_assembleia", { ascending: false });
    setLista(data || []);
  };
  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof vazio, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nome_condominio) return toast.error("Indique o prédio.");
    setSaving(true);
    try {
      let ficheiro_path = null, ficheiro_nome = null;
      if (file) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("assembleias").upload(path, file);
        if (error) throw error;
        ficheiro_path = path; ficheiro_nome = file.name;
      }
      const { error } = await db.from("assembleias").insert({
        ...form, data_assembleia: form.data_assembleia || null, ficheiro_path, ficheiro_nome,
      });
      if (error) throw error;
      toast.success("Assembleia guardada");
      setForm(vazio); setFile(null); setShowForm(false); load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao guardar");
    } finally { setSaving(false); }
  };

  const ver = async (a: Assembleia) => {
    if (!a.ficheiro_path) return;
    const { data } = await supabase.storage.from("assembleias").createSignedUrl(a.ficheiro_path, 3600);
    if (data?.signedUrl) setViewUrl(data.signedUrl);
  };

  const apagar = async (a: Assembleia) => {
    if (!confirm("Eliminar esta assembleia?")) return;
    if (a.ficheiro_path) await supabase.storage.from("assembleias").remove([a.ficheiro_path]);
    await db.from("assembleias").delete().eq("id", a.id);
    load();
  };

  const fazerAta = (a: Assembleia) => navigate("/nova-ata", { state: { assembleia: a } });

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-heading text-2xl font-bold text-foreground">Assembleias</h1>
          <Button onClick={() => setShowForm((s) => !s)}><Plus className="mr-2 h-4 w-4" />Nova assembleia</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por condomínio ou data (ex.: 24/09/2026)"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-9"
          />
        </div>

        {showForm && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Prédio / Condomínio</Label><Input value={form.nome_condominio} onChange={(e) => set("nome_condominio", e.target.value)} /></div>
              <div className="space-y-2"><Label>NIF do prédio</Label><Input value={form.nif} onChange={(e) => set("nif", e.target.value)} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.data_assembleia} onChange={(e) => set("data_assembleia", e.target.value)} /></div>
              <div className="space-y-2"><Label>Hora</Label><Input type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} /></div>
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ordinaria">Ordinária</SelectItem><SelectItem value="extraordinaria">Extraordinária</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Convocatória</Label>
                <Select value={form.convocatoria} onValueChange={(v) => set("convocatoria", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="primeira">Primeira</SelectItem><SelectItem value="segunda">Segunda</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Local da reunião</Label><Input value={form.local_reuniao} onChange={(e) => set("local_reuniao", e.target.value)} /></div>
              <div className="space-y-2"><Label>Documento digitalizado (PDF)</Label><Input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
            </div>
            <div className="space-y-2"><Label>Notas</Label><Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} /></div>
            <Button onClick={guardar} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        )}

        <div className="space-y-3">
          {listaFiltrada.length === 0 && (
            <p className="text-muted-foreground">
              {lista.length === 0 ? "Ainda não há assembleias guardadas." : "Nenhuma assembleia corresponde à pesquisa."}
            </p>
          )}
          {listaFiltrada.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div>
                <p className="font-medium text-foreground">{a.nome_condominio}</p>
                <p className="text-sm text-muted-foreground">
                  {a.data_assembleia ? new Date(a.data_assembleia).toLocaleDateString("pt-PT") : "Sem data"}
                  {a.hora ? ` · ${a.hora}` : ""} · {a.tipo === "extraordinaria" ? "Extraordinária" : "Ordinária"}
                  {a.ficheiro_nome && <> · <FileText className="inline h-3 w-3" /> {a.ficheiro_nome}</>}
                </p>
              </div>
              <div className="flex gap-2">
                {a.ficheiro_path && <Button variant="outline" size="sm" onClick={() => ver(a)}><Eye className="mr-1 h-4 w-4" />Ver</Button>}
                <Button size="sm" onClick={() => fazerAta(a)}><Sparkles className="mr-1 h-4 w-4" />Fazer ata</Button>
                <Button variant="ghost" size="sm" onClick={() => apagar(a)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!viewUrl} onOpenChange={(o) => !o && setViewUrl(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>Documento</DialogTitle></DialogHeader>
          {viewUrl && <iframe src={viewUrl} className="h-[75vh] w-full rounded border border-border" />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Assembleias;
