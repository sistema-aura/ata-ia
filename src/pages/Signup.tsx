import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, Mail, Lock, Eye, EyeOff, Building2, User, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type SignupMode = "company" | "employee";

const Signup = () => {
  const [mode, setMode] = useState<SignupMode>("company");
  const [companyName, setCompanyName] = useState("");
  const [employeeCompanyCode, setEmployeeCompanyCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Conta Criada!");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const emailPlaceholder = useMemo(
    () => (mode === "company" ? "email@empresa.com" : "funcionario@empresa.com"),
    [mode]
  );

  const validateCommonFields = () => {
    if (!fullName.trim()) {
      toast.error(mode === "company" ? "Introduza o nome do responsável" : "Introduza o seu nome");
      return false;
    }

    if (!email.trim()) {
      toast.error("Introduza o email");
      return false;
    }

    if (password.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("As passwords não coincidem");
      return false;
    }

    return true;
  };

  const handleCompanySignup = async () => {
    if (!companyName.trim()) {
      toast.error("Introduza o nome da empresa");
      return;
    }

    if (!validateCommonFields()) return;

    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-company`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        companyName: companyName.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      toast.error(data.error || "Erro ao criar conta");
      return;
    }

    setSuccessTitle("Conta Criada!");
    setSuccessMessage(`A empresa ${companyName.trim()} foi registada com sucesso. A sua conta está pendente de ativação.`);
    setSuccess(true);
    toast.success("Conta criada com sucesso!");
  };

  const handleEmployeeSignup = async () => {
    if (!employeeCompanyCode.trim()) {
      toast.error("Introduza o código da empresa");
      return;
    }

    if (!validateCommonFields()) return;

    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-employee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        companyCode: employeeCompanyCode.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      toast.error(data.error || "Erro ao criar conta de funcionário");
      return;
    }

    setSuccessTitle("Funcionário registado!");
    setSuccessMessage(data.message || `A sua conta foi associada à empresa ${data.companyName}.`);
    setSuccess(true);
    toast.success("Conta de funcionário criada com sucesso!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "company") {
        await handleCompanySignup();
      } else {
        await handleEmployeeSignup();
      }
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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <FileText className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Atas<span className="text-gradient-gold">IA</span>
            </h1>
          </div>

          <div className="rounded-lg border border-border bg-card p-8 shadow-document">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              {mode === "company" ? (
                <Building2 className="h-8 w-8 text-accent" />
              ) : (
                <User className="h-8 w-8 text-accent" />
              )}
            </div>
            <h2 className="mb-2 font-heading text-xl font-bold text-foreground">{successTitle}</h2>
            <p className="mb-6 text-sm text-muted-foreground">{successMessage}</p>
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
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <FileText className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Atas<span className="text-gradient-gold">IA</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Cria a tua conta</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-document">
          <Tabs value={mode} onValueChange={(value) => setMode(value as SignupMode)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="company">Conta Empresa</TabsTrigger>
              <TabsTrigger value="employee">Conta Funcionário</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSignup} className="space-y-4">
              <TabsContent value="company" className="space-y-4">
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
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employee" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeCompanyCode">Código da Empresa *</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="employeeCompanyCode"
                      type="text"
                      placeholder="Ex.: nome-da-empresa"
                      value={employeeCompanyCode}
                      onChange={(e) => setEmployeeCompanyCode(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Introduza o código que a sua empresa lhe forneceu.
                  </p>
                </div>
              </TabsContent>

              <div className="space-y-2">
                <Label htmlFor="fullName">{mode === "company" ? "Nome do Responsável *" : "Nome Completo *"}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={mode === "company" ? "Nome do responsável" : "Nome do funcionário"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
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
                    placeholder={emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
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
                {mode === "company" ? "Criar Conta Empresa" : "Criar Conta Funcionário"}
              </Button>
            </form>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Iniciar sessão
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;