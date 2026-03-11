import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import NovaAta from "./pages/NovaAta";
import Historico from "./pages/Historico";
import Suporte from "./pages/Suporte";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmpresas from "./pages/admin/AdminEmpresas";
import AdminUtilizadores from "./pages/admin/AdminUtilizadores";
import AdminTickets from "./pages/admin/AdminTickets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/nova-ata" element={<ProtectedRoute><NovaAta /></ProtectedRoute>} />
            <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
            <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/empresas" element={<ProtectedRoute requireAdmin><AdminEmpresas /></ProtectedRoute>} />
            <Route path="/admin/utilizadores" element={<ProtectedRoute requireAdmin><AdminUtilizadores /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute requireAdmin><AdminTickets /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
