import { PontoOrdemDia } from "@/types/ata";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListOrdered, Plus, Trash2, Lock, Pencil } from "lucide-react";

interface Props {
  pontos: PontoOrdemDia[];
  updatePonto: (index: number, updates: Partial<PontoOrdemDia>) => void;
  addPonto: () => void;
  removePonto: (index: number) => void;
  observacoes: string;
  onObservacoesChange: (v: string) => void;
}

export const PontosOrdemDiaForm = ({
  pontos,
  updatePonto,
  addPonto,
  removePonto,
  observacoes,
  onObservacoesChange,
}: Props) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-document">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Ordem de Trabalhos
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addPonto}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Ponto
        </Button>
      </div>

      <div className="space-y-3">
        {pontos.map((ponto, index) => (
          <div
            key={ponto.id}
            className="group rounded-md border border-border bg-background p-4 transition-colors hover:bg-muted/50 animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {ponto.tipo === "padrao" ? (
                    <>
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Lock className="h-3 w-3" />
                        Padrão
                      </Badge>
                      <span className="font-medium text-foreground">
                        {ponto.titulo}
                      </span>
                    </>
                  ) : (
                    <>
                      <Badge className="gap-1 text-xs bg-accent text-accent-foreground">
                        <Pencil className="h-3 w-3" />
                        Personalizado
                      </Badge>
                      <Input
                        placeholder="Título do ponto"
                        value={ponto.titulo}
                        onChange={(e) =>
                          updatePonto(index, { titulo: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                    </>
                  )}
                </div>

              {ponto.tipo === "padrao" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {ponto.descricaoPadrao}
                    </p>
                    <Textarea
                      placeholder="Notas adicionais (ex: quem foi eleito, valores aprovados, etc.)"
                      value={ponto.notas || ""}
                      onChange={(e) =>
                        updatePonto(index, { notas: e.target.value })
                      }
                      className="min-h-[50px] text-sm"
                    />
                  </div>
                ) : (
                  <Textarea
                    placeholder="Notas e detalhes para este ponto (deliberações, votações, etc.)"
                    value={ponto.notas || ""}
                    onChange={(e) =>
                      updatePonto(index, { notas: e.target.value })
                    }
                    className="min-h-[60px] text-sm"
                  />
                )}
              </div>

              {ponto.tipo === "personalizado" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePonto(index)}
                  className="h-8 w-8 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Observações */}
      <div className="mt-6 space-y-2">
        <Label htmlFor="observacoes">Observações Adicionais (opcional)</Label>
        <Textarea
          id="observacoes"
          placeholder="Informações adicionais que deseja incluir na ata..."
          value={observacoes}
          onChange={(e) => onObservacoesChange(e.target.value)}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
};
