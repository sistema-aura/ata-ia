import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Mail, Lock, Eye, EyeOff, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Signup = () => {
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Introduza o nome da empresa");
      return;
    }
    if (!email.trim()) {
      toast.error("Introduza o email");
      return;
    }
    if (password.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As passwords não coincidem");
      return;
    }

    setLoading(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-company`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            companyName: companyName.trim(),
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        toast.error(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Conta criada com sucesso!");
    } catch {
      toast.error("Erro de ligação ao servidor");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
              <FileText className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Atas<span className="text-gradient-gold">IA</span>
            </h1>
          </div>

          <div className="rounded-lg border border-border bg-card p-8 shadow-document">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mx-auto mb-4">
              <Building2 className="h-8 w-8 text-accent" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              Conta Criada!
            </h2>
            <p className="text-muted-foreground mb-2">
              A empresa <strong>{companyName}</strong> foi registada com sucesso.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              A sua conta está pendente de ativação. Entraremos em contacto consigo para finalizar o processo de pagamento e ativar o acesso.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Voltar ao Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
            <FileText className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Atas<span className="text-gradient-gold">IA</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Crie a conta da sua empresa</p>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-document">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Nome da sua empresa"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome do Responsável</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nome completo (opcional)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Este será o único email de acesso. Para adicionar mais utilizadores, abra um ticket de suporte.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Iniciar sessão
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
