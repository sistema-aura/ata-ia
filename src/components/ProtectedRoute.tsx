import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: Props) => {
  const { user, loading, isAdmin, company } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if company is blocked (non-admin only)
  if (!requireAdmin && company && !company.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper p-8 text-center">
        <div className="rounded-lg border border-destructive/30 bg-card p-8 shadow-document max-w-md">
          <h1 className="font-heading text-2xl font-bold text-destructive mb-4">
            Acesso Bloqueado
          </h1>
          <p className="text-muted-foreground mb-2">
            O acesso da sua empresa foi temporariamente suspenso.
          </p>
          {company.blocked_reason && (
            <p className="text-sm text-muted-foreground mb-4">
              Motivo: {company.blocked_reason}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Entre em contacto com o suporte para resolver esta situação.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
