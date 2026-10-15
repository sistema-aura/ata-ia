import { useEffect, useMemo, useState } from "react";
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
import {
  ArrowLeft, CalendarDays, CheckCheck, Download, Eye, FileText, FolderOpen, Folder,
  Pencil, Plus, Search, Sparkles, Trash2, Loader2, X,
} from "lucide-react";
import { CondominioCombobox } from "@/components/CondominioCombobox";
import { PDFDocument } from "pdf-lib";

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
  resumo_path: string | null;
  resumo_nome: string | null;
  ordem_path: string | null;
  ordem_nome: string | null;
  presencas_path: string | null;
  presencas_nome: string | null;
  dividas_path: string | null;
  dividas_nome: string | null;
  ata_feita: boolean | null;
};

type CondominioInfo = { nome: string; codigo: string | null; morada: string | null };

const DOCS = [
  { key: "ficheiro", label: "Documento digitalizado" },
  { key: "ordem", label: "Ordem de trabalhos" },
  { key: "presencas", label: "Registo de presenças" },
  { key: "dividas", label: "Mapa de dívidas" },
  { key: "resumo", label: "Resumo da reunião (tablet)" },
] as const;

type DocKey = (typeof DOCS)[number]["key"];

const vazio = {
  nome_condominio: "", nif: "", data_assembleia: "", hora: "",
  tipo: "ordinaria", convocatoria: "primeira", local_reuniao: "", notas: "",
};

const db = supabase as any;

const parsePageRanges = (input: string, max: number): number[] => {
  const pages = new Set<number>();
  for (const part of input.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) pages.add(i);
    } else if (/^\d+$/.test(p)) {
      pages.add(parseInt(p, 10));
    }
  }
  return [...pages].filter((n) => n >= 1 && n <= max).sort((a, b) => a - b);
};

const Assembleias = () => {
  const navigate = useNavigate();
  const [lista, setLista] = useState<Assembleia[]>([]);
  const [condominios, setCondominios] = useState<Record<string, CondominioInfo>>({});
  const [form, setForm] = useState(vazio);
  const [files, setFiles] = useState<Partial<Record<DocKey, File>>>({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewTitulo, setViewTitulo] = useState("");
  const [paginas, setPaginas] = useState("");
  const [extraindo, setExtraindo] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pastaAberta, setPastaAberta] = useState<string | null>(null);

  const load = async () => {
    const [{ data: asm }, { data: cond }] = await Promise.all([
      db.from("assembleias").select("*").order("data_assembleia", { ascending: false }),
      db.from("condominios").select("nome, codigo, morada"),
    ]);
    setLista(asm || []);
    const map: Record<string, CondominioInfo> = {};
    for (const c of cond || []) map[c.nome] = c;
    setCondominios(map);
  };
  useEffect(() => { load(); }, []);

  const filtro = pesquisa.trim().toLowerCase();

  const pastas = useMemo(() => {
    const grupos = new Map<string, Assembleia[]>();
    for (const a of lista) {
      const arr = grupos.get(a.nome_condominio) || [];
      arr.push(a);
      grupos.set(a.nome_condominio, arr);
    }
    let entries = [...grupos.entries()];
    if (filtro) {
      entries = entries
        .map(([nome, arr]) => {
          const info = condominios[nome];
          const matchPasta =
            nome.toLowerCase().includes(filtro) ||
            (info?.codigo || "").toLowerCase().includes(filtro) ||
            (info?.morada || "").toLowerCase().includes(filtro);
          if (matchPasta) return [nome, arr] as [string, Assembleia[]];
          const arrFiltrado = arr.filter((a) => {
            const dataPt = a.data_assembleia ? new Date(a.data_assembleia).toLocaleDateString("pt-PT") : "";
            return dataPt.includes(filtro) || (a.data_assembleia || "").includes(filtro);
          });
          return [nome, arrFiltrado] as [string, Assembleia[]];
        })
        .filter(([, arr]) => arr.length > 0);
    }
    entries.sort(([a], [b]) => {
      const ca = condominios[a]?.codigo || "zzz";
      const cb = condominios[b]?.codigo || "zzz";
      return ca.localeCompare(cb) || a.localeCompare(b);
    });
    return entries;
  }, [lista, condominios, filtro]);

  const set = (k: keyof typeof vazio, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const editar = (a: Assembleia) => {
    setEditingId(a.id);
    setForm({
      nome_condominio: a.nome_condominio || "",
      nif: a.nif || "",
      data_assembleia: a.data_assembleia || "",
      hora: a.hora || "",
      tipo: a.tipo || "ordinaria",
      convocatoria: a.convocatoria || "primeira",
      local_reuniao: a.local_reuniao || "",
      notas: a.notas || "",
    });
    setFiles({});
    setShowForm(true);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicao = () => {
    setEditingId(null);
    setForm(vazio);
    setFiles({});
    setShowForm(false);
    setFormKey((k) => k + 1);
  };

  const guardar = async () => {
    if (!form.nome_condominio) return toast.error("Indique o prédio.");
    setSaving(true);
    try {
      const atual = editingId ? lista.find((a) => a.id === editingId) : undefined;
      const payload: Record<string, any> = { ...form, data_assembleia: form.data_assembleia || null };

      for (const doc of DOCS) {
        const pathKey = `${doc.key}_path` as const;
        const nomeKey = `${doc.key}_nome` as const;
        payload[pathKey] = atual?.[pathKey] ?? null;
        payload[nomeKey] = atual?.[nomeKey] ?? null;
        const f = files[doc.key];
        if (f) {
          const path = `${doc.key}-${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
          const { error } = await supabase.storage.from("assembleias").upload(path, f);
          if (error) throw error;
          if (payload[pathKey]) await supabase.storage.from("assembleias").remove([payload[pathKey]]);
          payload[pathKey] = path;
          payload[nomeKey] = f.name;
        }
      }

      const { error } = editingId
        ? await db.from("assembleias").update(payload).eq("id", editingId)
        : await db.from("assembleias").insert(payload);
      if (error) throw error;
      toast.success(editingId ? "Assembleia atualizada" : "Assembleia guardada");
      cancelarEdicao();
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao guardar");
    } finally { setSaving(false); }
  };

  const ver = async (a: Assembleia, docKey: DocKey) => {
    const path = a[`${docKey}_path` as keyof Assembleia] as string | null;
    if (!path) return;
    const { data } = await supabase.storage.from("assembleias").createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      setViewUrl(data.signedUrl);
      setViewTitulo(`${DOCS.find((d) => d.key === docKey)?.label} — ${a.nome_condominio}`);
      setPaginas("");
    }
  };

  const guardarPaginas = async () => {
    if (!viewUrl) return;
    setExtraindo(true);
    try {
      const res = await fetch(viewUrl);
      const bytes = await res.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const nums = parsePageRanges(paginas, src.getPageCount());
      if (nums.length === 0) {
        toast.error("Indique páginas válidas (ex.: 1-3, 5).");
        return;
      }
      const out = await PDFDocument.create();
      const copiadas = await out.copyPages(src, nums.map((n) => n - 1));
      copiadas.forEach((p) => out.addPage(p));
      const pdfBytes = await out.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paginas-${nums.join("_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${nums.length} página(s) guardada(s)`);
    } catch {
      toast.error("Não foi possível extrair as páginas deste ficheiro.");
    } finally { setExtraindo(false); }
  };

  const apagar = async (a: Assembleia) => {
    if (!confirm("Eliminar esta assembleia e todos os seus documentos?")) return;
    for (const doc of DOCS) {
      const path = a[`${doc.key}_path` as keyof Assembleia] as string | null;
      if (path) await supabase.storage.from("assembleias").remove([path]);
    }
    await db.from("assembleias").delete().eq("id", a.id);
    load();
  };

  const fazerAta = (a: Assembleia) => navigate("/nova-ata", { state: { assembleia: a } });

  const marcarAtaFeita = async (a: Assembleia) => {
    const novo = !a.ata_feita;
    await db.from("assembleias").update({ ata_feita: novo }).eq("id", a.id);
    setLista((l) => l.map((x) => (x.id === a.id ? { ...x, ata_feita: novo } : x)));
    toast.success(novo ? "Marcada como ata feita" : "Marcação removida");
  };

  const docCount = (a: Assembleia) =>
    DOCS.filter((d) => a[`${d.key}_path` as keyof Assembleia]).length;

  const assembleiasDaPasta = pastaAberta
    ? (pastas.find(([n]) => n === pastaAberta)?.[1] || [])
    : [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {pastaAberta && (
              <Button variant="ghost" size="icon" onClick={() => setPastaAberta(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {pastaAberta || "Assembleias"}
              </h1>
              {pastaAberta && condominios[pastaAberta]?.morada && (
                <p className="text-sm text-muted-foreground">{condominios[pastaAberta].morada}</p>
              )}
            </div>
          </div>
          <Button onClick={() => { cancelarEdicao(); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />Nova assembleia
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por prédio, código ou data (ex.: 24/09/2026)"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-9"
          />
        </div>

        {showForm && (
          <div key={formKey} className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-document">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-foreground">{editingId ? "Editar assembleia" : "Nova assembleia"}</h2>
              <Button variant="ghost" size="sm" onClick={cancelarEdicao}><X className="mr-1 h-4 w-4" />Cancelar</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Prédio / Condomínio</Label>
                <CondominioCombobox
                  value={form.nome_condominio}
                  onChange={(v) => set("nome_condominio", v)}
                  onSelect={(c) => setForm((f) => ({ ...f, nome_condominio: c.nome, nif: c.nif || f.nif }))}
                /></div>
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
              <div className="space-y-2 md:col-span-2"><Label>Local da reunião</Label><Input value={form.local_reuniao} onChange={(e) => set("local_reuniao", e.target.value)} /></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {DOCS.map((doc) => {
                const atual = editingId ? lista.find((a) => a.id === editingId) : undefined;
                const nomeAtual = atual?.[`${doc.key}_nome` as keyof Assembleia] as string | null;
                return (
                  <div className="space-y-2" key={doc.key}>
                    <Label>{doc.label} (PDF)</Label>
                    <Input
                      key={`${doc.key}-${formKey}`}
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setFiles((f) => ({ ...f, [doc.key]: e.target.files?.[0] || undefined }))}
                    />
                    {editingId && !files[doc.key] && nomeAtual && (
                      <p className="text-xs text-muted-foreground">
                        Atual: {nomeAtual} (escolha um ficheiro para substituir)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-2"><Label>Notas</Label><Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} /></div>
            <div className="flex gap-2">
              <Button onClick={guardar} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? "Guardar alterações" : "Guardar"}</Button>
              <Button variant="outline" onClick={cancelarEdicao}>Cancelar</Button>
            </div>
          </div>
        )}

        {!pastaAberta && (
          <>
            {pastas.length === 0 && (
              <p className="text-muted-foreground">
                {lista.length === 0 ? "Ainda não há assembleias guardadas." : "Nenhuma pasta corresponde à pesquisa."}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastas.map(([nome, arr]) => {
                const info = condominios[nome];
                const totalDocs = arr.reduce((s, a) => s + docCount(a), 0);
                return (
                  <button
                    key={nome}
                    onClick={() => setPastaAberta(nome)}
                    className="group relative rounded-xl border border-border bg-card p-5 text-left shadow-document transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <Folder className="h-8 w-8 text-accent" />
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {arr.length} {arr.length === 1 ? "assembleia" : "assembleias"}
                      </span>
                    </div>
                    {info?.codigo && (
                      <p className="font-heading text-xl font-bold text-foreground">{info.codigo}</p>
                    )}
                    <p className="font-medium leading-snug text-foreground">{nome}</p>
                    {info?.morada && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">{info.morada}</p>
                    )}
                    <p className="mt-3 border-t border-dashed border-border pt-2 text-xs text-muted-foreground">
                      {totalDocs} {totalDocs === 1 ? "documento" : "documentos"}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {pastaAberta && (
          <div className="space-y-3">
            {assembleiasDaPasta.length === 0 && (
              <p className="text-muted-foreground">Nenhuma assembleia nesta pasta corresponde à pesquisa.</p>
            )}
            {assembleiasDaPasta.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-card p-4 shadow-document">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <CalendarDays className="h-4 w-4 text-accent" />
                      {a.data_assembleia ? new Date(a.data_assembleia).toLocaleDateString("pt-PT") : "Sem data"}
                      {a.hora ? ` · ${a.hora}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {a.tipo === "extraordinaria" ? "Extraordinária" : "Ordinária"}
                      {a.convocatoria ? ` · ${a.convocatoria === "segunda" ? "2ª" : "1ª"} convocatória` : ""}
                      {a.local_reuniao ? ` · ${a.local_reuniao}` : ""}
                    </p>
                    {a.ata_feita && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/40 dark:text-green-400">
                        <CheckCheck className="h-3 w-3" />Ata feita
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={a.ata_feita ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => marcarAtaFeita(a)}
                    >
                      <CheckCheck className="mr-1 h-4 w-4" />{a.ata_feita ? "Desmarcar" : "Ata feita"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => editar(a)}><Pencil className="mr-1 h-4 w-4" />Editar</Button>
                    <Button size="sm" onClick={() => fazerAta(a)}><Sparkles className="mr-1 h-4 w-4" />Fazer ata</Button>
                    <Button variant="ghost" size="sm" onClick={() => apagar(a)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-border pt-3">
                  {DOCS.map((doc) => {
                    const tem = !!a[`${doc.key}_path` as keyof Assembleia];
                    return (
                      <Button
                        key={doc.key}
                        variant={tem ? "outline" : "ghost"}
                        size="sm"
                        disabled={!tem}
                        onClick={() => ver(a, doc.key)}
                        className={tem ? "" : "opacity-40"}
                      >
                        {tem ? <Eye className="mr-1 h-3.5 w-3.5" /> : <FileText className="mr-1 h-3.5 w-3.5" />}
                        {doc.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!viewUrl} onOpenChange={(o) => !o && setViewUrl(null)}>
        <DialogContent className="flex h-[92vh] max-w-6xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-accent" />{viewTitulo}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Páginas a guardar (ex.: 1-3, 5)"
              value={paginas}
              onChange={(e) => setPaginas(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={guardarPaginas} disabled={extraindo || !paginas.trim()}>
              {extraindo ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
              Guardar páginas
            </Button>
          </div>
          {viewUrl && <iframe src={viewUrl} className="min-h-0 w-full flex-1 rounded border border-border" />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Assembleias;
