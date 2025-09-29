import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireAuth from "./components/RequireAuth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import Expenses from "./pages/Expenses";
import Sales from "./pages/Sales";
import Checks from "./pages/Checks";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <PWAUpdatePrompt />
            <Routes>
              <Route path="/" element={<ProtectedRoute />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/abc" element={<Register />} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
              <Route path="/create-project" element={<RequireAuth><CreateProject /></RequireAuth>} />
              <Route path="/expenses" element={<RequireAuth><Expenses /></RequireAuth>} />
              <Route path="/sales" element={<RequireAuth><Sales /></RequireAuth>} />
              <Route path="/checks" element={<RequireAuth><Checks /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
