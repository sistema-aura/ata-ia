import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import NovaAta from "./pages/NovaAta";
import Assembleias from "./pages/Assembleias";
import Historico from "./pages/Historico";
import AdminTemplates from "./pages/admin/AdminTemplates";
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
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assembleias" element={<Assembleias />} />
            <Route path="/nova-ata" element={<NovaAta />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/templates" element={<AdminTemplates />} />
            <Route path="/formatacao" element={<AdminFormatacao />} />
            <Route path="/admin/templates" element={<Navigate to="/templates" replace />} />
            <Route path="/admin/formatacao" element={<Navigate to="/formatacao" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
