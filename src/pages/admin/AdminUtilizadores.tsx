import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, KeyRound, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

const AdminUtilizadores = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetDialog, setResetDialog] = useState<{ open: boolean; userId: string; email: string }>({
    open: false,
    userId: "",
    email: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    const [profilesRes, authRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.functions.invoke("admin-users", { body: { action: "list_users" } }),
    ]);
    setProfiles((profilesRes.data as Profile[]) || []);
    if (authRes.data?.users) {
      setAuthUsers(authRes.data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres");
      return;
    }
    setResetting(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "reset_password", userId: resetDialog.userId, password: newPassword },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao alterar password");
    } else {
      toast.success("Password alterada com sucesso");
      setResetDialog({ open: false, userId: "", email: "" });
      setNewPassword("");
    }
    setResetting(false);
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Email copiado");
  };

  const getAuthUser = (id: string) => authUsers.find((u) => u.id === id);

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Utilizadores</h1>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((p) => {
              const auth = getAuthUser(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground">{p.full_name || "Sem nome"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                      <button onClick={() => copyEmail(p.email)} className="text-muted-foreground hover:text-foreground shrink-0">
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    {auth?.last_sign_in_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Último login: {new Date(auth.last_sign_in_at).toLocaleString("pt-PT")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.company_id ? "default" : "secondary"}>
                      {p.company_id ? "Com empresa" : "Sem empresa"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-PT")}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setResetDialog({ open: true, userId: p.id, email: p.email })
                      }
                    >
                      <KeyRound className="h-3.5 w-3.5 mr-1" />
                      Password
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={resetDialog.open} onOpenChange={(open) => {
        setResetDialog((prev) => ({ ...prev, open }));
        if (!open) setNewPassword("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Alterar password para <strong>{resetDialog.email}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog({ open: false, userId: "", email: "" })}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={resetting}>
              {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AdminUtilizadores;
