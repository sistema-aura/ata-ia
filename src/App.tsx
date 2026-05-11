import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import NovaAta from "./pages/NovaAta";
import Historico from "./pages/Historico";
import Suporte from "./pages/Suporte";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCodigosEmpresa from "./pages/admin/AdminCodigosEmpresa";
import AdminEmpresas from "./pages/admin/AdminEmpresas";
import AdminUtilizadores from "./pages/admin/AdminUtilizadores";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminPagamentos from "./pages/admin/AdminPagamentos";
import AdminPrecos from "./pages/admin/AdminPrecos";
import AdminFormatacao from "./pages/admin/AdminFormatacao";
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nova-ata" element={<NovaAta />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/suporte" element={<Suporte />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/codigos-empresa" element={<AdminCodigosEmpresa />} />
            <Route path="/admin/empresas" element={<AdminEmpresas />} />
            <Route path="/admin/utilizadores" element={<AdminUtilizadores />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route path="/admin/formatacao" element={<AdminFormatacao />} />
            <Route path="/admin/precos" element={<AdminPrecos />} />
            <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
