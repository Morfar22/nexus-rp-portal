import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import StaffProtectedRoute from "@/components/StaffProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Apply from "./pages/Apply";
import Rules from "./pages/Rules";
import Map from "./pages/Map";
import StaffPanel from "./pages/StaffPanel";
import OurTeam from "./pages/OurTeam";
import ServerManagement from "./pages/ServerManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/map" element={<Map />} />
            <Route path="/apply" element={
              <ProtectedRoute>
                <Apply />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <StaffProtectedRoute>
                <StaffPanel />
              </StaffProtectedRoute>
            } />
            <Route path="/servers" element={
              <StaffProtectedRoute>
                <ServerManagement />
              </StaffProtectedRoute>
            } />
            <Route path="/users" element={
              <StaffProtectedRoute>
                <UserManagement />
              </StaffProtectedRoute>
            } />
            <Route path="/team" element={<OurTeam />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
