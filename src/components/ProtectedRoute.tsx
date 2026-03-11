import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireActive?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false, requireActive = false }: Props) => {
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

  // If route requires active company and company is blocked, redirect to dashboard
  if (requireActive && !isAdmin && company && !company.is_active) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
