import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Edit3, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

interface Ata {
  id: string;
  nome_condominio: string;
  data_assembleia: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
}

const Historico = () => {
  const { company } = useAuth();
  const [atas, setAtas] = useState<Ata[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAta, setEditingAta] = useState<Ata | null>(null);
  const [editContent, setEditContent] = useState("");
  const [viewingAta, setViewingAta] = useState<Ata | null>(null);

  const fetchAtas = async () => {
    if (!company) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("atas")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar atas"); console.error(error); }
    else setAtas(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAtas(); }, [company]);

  const deleteAta = async (id: string) => {
    const { error } = await supabase.from("atas").delete().eq("id", id);
    if (error) toast.error("Erro ao eliminar ata");
    else { toast.success("Ata eliminada com sucesso"); setAtas((prev) => prev.filter((a) => a.id !== id)); }
  };

  const saveEdit = async () => {
    if (!editingAta) return;
    const { error } = await supabase.from("atas").update({ conteudo: editContent }).eq("id", editingAta.id);
    if (error) toast.error("Erro ao guardar alterações");
    else {
      toast.success("Ata atualizada com sucesso");
      setAtas((prev) => prev.map((a) => a.id === editingAta.id ? { ...a, conteudo: editContent } : a));
      setEditingAta(null);
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Histórico de Atas</h1>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
        ) : atas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="mb-4 h-12 w-12 opacity-40" />
            <p className="font-heading text-lg">Nenhuma ata guardada</p>
            <p className="text-sm">As atas geradas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {atas.map((ata) => (
              <div key={ata.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-document">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold text-foreground truncate">{ata.nome_condominio}</h3>
                  <p className="text-sm text-muted-foreground">
                    Assembleia: {ata.data_assembleia} · Criada em {new Date(ata.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => setViewingAta(ata)} title="Ver ata"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingAta(ata); setEditContent(ata.conteudo); }} title="Editar ata"><Edit3 className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Eliminar ata"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar ata?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser revertida.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAta(ata.id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!viewingAta} onOpenChange={() => setViewingAta(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">{viewingAta?.nome_condominio}</DialogTitle></DialogHeader>
            <div className="ata-document"><div className="prose prose-sm max-w-none text-foreground"><ReactMarkdown>{viewingAta?.conteudo || ""}</ReactMarkdown></div></div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingAta} onOpenChange={() => setEditingAta(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Editar Ata</DialogTitle></DialogHeader>
            <textarea className="min-h-[400px] w-full rounded-md border border-border bg-background p-4 font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingAta(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Guardar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Historico;
