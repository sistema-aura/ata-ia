import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loadCondominios, Condominio } from "@/components/CondominioCombobox";
import { Building2, Search, FolderOpen, ArrowLeft, FileText, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

const db = supabase as any;

const Condominios = () => {
  const navigate = useNavigate();
  const [lista, setLista] = useState<Condominio[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [selecionado, setSelecionado] = useState<Condominio | null>(null);
  const [assembleias, setAssembleias] = useState<any[]>([]);
  const [atas, setAtas] = useState<any[]>([]);

  useEffect(() => {
    loadCondominios().then(setLista);
  }, []);

  const filtrados = useMemo(() => {
    const f = pesquisa.trim().toLowerCase();
    if (!f) return lista;
    return lista.filter(
      (c) =>
        c.nome.toLowerCase().includes(f) ||
        c.codigo.startsWith(f) ||
        (c.nif || "").includes(f)
    );
  }, [lista, pesquisa]);

  const abrirPasta = async (c: Condominio) => {
    setSelecionado(c);
    const [{ data: ass }, { data: at }] = await Promise.all([
      db.from("assembleias").select("*").ilike("nome_condominio", `%${c.nome}%`).order("data_assembleia", { ascending: false }),
      db.from("atas").select("*").ilike("nome_condominio", `%${c.nome}%`).order("created_at", { ascending: false }),
    ]);
    setAssembleias(ass || []);
    setAtas(at || []);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {!selecionado ? (
          <>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Condomínios</h1>
              <p className="text-sm text-muted-foreground">
                Todos os prédios geridos. Clique num prédio para ver as suas assembleias e atas.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, código ou NIF"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="pl-9"
              />
            </div>

            {filtrados.length === 0 && (
              <p className="text-muted-foreground">Nenhum condomínio corresponde à pesquisa.</p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {filtrados.map((c) => (
                <button
                  key={c.id}
                  onClick={() => abrirPasta(c)}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-document transition-colors hover:border-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground group-hover:text-accent">
                      {c.nome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{c.morada}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.nif ? `NIF ${c.nif}` : "Sem NIF"}
                      {c.fraccoes ? ` · ${c.fraccoes} frações` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelecionado(null)}>
                <ArrowLeft className="mr-1 h-4 w-4" />Voltar
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-document">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                  <FolderOpen className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h1 className="font-heading text-xl font-bold text-foreground">{selecionado.nome}</h1>
                  <p className="text-sm text-muted-foreground">{selecionado.morada}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selecionado.nif ? `NIF ${selecionado.nif}` : "Sem NIF"}
                    {selecionado.fraccoes ? ` · ${selecionado.fraccoes} frações` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Assembleias ({assembleias.length})
              </h2>
              {assembleias.length === 0 && (
                <p className="text-sm text-muted-foreground">Ainda não há assembleias deste prédio.</p>
              )}
              {assembleias.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CalendarDays className="h-4 w-4 text-accent" />
                      {a.data_assembleia ? new Date(a.data_assembleia).toLocaleDateString("pt-PT") : "Sem data"}
                      {a.hora ? ` · ${a.hora}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.tipo === "extraordinaria" ? "Extraordinária" : "Ordinária"}
                      {a.local_reuniao ? ` · ${a.local_reuniao}` : ""}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate("/nova-ata", { state: { assembleia: a } })}>
                    Fazer ata
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Atas ({atas.length})
              </h2>
              {atas.length === 0 && (
                <p className="text-sm text-muted-foreground">Ainda não há atas deste prédio.</p>
              )}
              {atas.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                  <FileText className="h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.data_assembleia}</p>
                    <p className="text-xs text-muted-foreground">
                      Criada em {new Date(a.created_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Condominios;
