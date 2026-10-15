import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

export interface Condominio {
  id: string;
  codigo: string;
  nome: string;
  nif: string;
  morada: string;
  fraccoes: number | null;
  ativo: boolean;
}

interface Props {
  value: string;
  onChange: (nome: string) => void;
  onSelect?: (c: Condominio) => void;
  placeholder?: string;
  id?: string;
}

// Cache partilhado para não repetir a query em cada formulário
let cache: Condominio[] | null = null;
let cachePromise: Promise<Condominio[]> | null = null;

export const loadCondominios = async (): Promise<Condominio[]> => {
  if (cache) return cache;
  if (!cachePromise) {
    cachePromise = (supabase as any)
      .from("condominios")
      .select("id,codigo,nome,nif,morada,fraccoes,ativo")
      .order("codigo")
      .then(({ data }: any) => {
        cache = (data || []) as Condominio[];
        return cache;
      });
  }
  return cachePromise;
};

export const CondominioCombobox = ({ value, onChange, onSelect, placeholder, id }: Props) => {
  const [lista, setLista] = useState<Condominio[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCondominios().then(setLista);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtro = value.trim().toLowerCase();
  const sugestoes = filtro
    ? lista.filter((c) => c.nome.toLowerCase().includes(filtro) || c.codigo.startsWith(filtro)).slice(0, 8)
    : [];

  const escolher = (c: Condominio) => {
    onChange(c.nome);
    onSelect?.(c);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || sugestoes.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, sugestoes.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && sugestoes[highlight]) {
            e.preventDefault();
            escolher(sugestoes[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && sugestoes.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {sugestoes.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(c);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                i === highlight ? "bg-muted" : ""
              }`}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="shrink-0 text-xs font-medium text-muted-foreground">{c.codigo}</span>
              <span className="truncate text-foreground">{c.nome}</span>
              {c.nif && <span className="ml-auto shrink-0 text-xs text-muted-foreground">NIF {c.nif}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
