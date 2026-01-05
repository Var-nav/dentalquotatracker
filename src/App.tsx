import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Target } from "lucide-react";
import { UserMetaPill } from "@/components/UserMetaPill";
import { HeaderUserActions } from "@/components/HeaderUserActions";
import { THEME_PRESETS, applyThemeColors } from "@/config/themes";
import Dashboard from "./pages/Dashboard";
import AddCase from "./pages/AddCase";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import MyAccountPage from "./pages/MyAccount";
import ManageBatchesPage from "./pages/ManageBatches";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import OnboardingPage from "./pages/Onboarding";
import AssessmentsPage from "./pages/Assessments";
import { AuthProvider } from "@/hooks/useAuth";


const queryClient = new QueryClient();

const App = () => {
  // Initialize theme on app load
  useEffect(() => {
    const loadTheme = () => {
      try {
        const localTheme = localStorage.getItem("varshify_theme");
        if (localTheme) {
          const parsed = JSON.parse(localTheme);
          const preset = THEME_PRESETS.find((p) => p.id === parsed.preset);
          if (preset) {
            const colors = { ...preset.colors };
            if (parsed.customPrimary) colors.primary = parsed.customPrimary;
            if (parsed.customSecondary) colors.secondary = parsed.customSecondary;
            if (parsed.customAccent) colors.accent = parsed.customAccent;
            applyThemeColors(colors);
          }
        }
      } catch (error) {
        console.error("Failed to load theme on startup", error);
      }
    };
    loadTheme();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-purple/5 via-background to-teal/5">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <header className="h-16 border-b border-border/50 bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="mr-3 h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 hover:scale-110" />
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple via-primary to-teal flex items-center justify-center shadow-md">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <h1 className="text-2xl font-cursive font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
                        Varshify
                      </h1>
                    </div>
                  </div>
                  <HeaderUserActions />
                </header>
                <main className="flex-1 p-6 overflow-auto">
                  <div className="max-w-7xl mx-auto">
                    <Routes>
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/onboarding" element={<OnboardingPage />} />
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/add-case" element={<AddCase />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/assessments" element={<AssessmentsPage />} />
                      <Route path="/history" element={<History />} />
                      <Route path="/account" element={<MyAccountPage />} />
                      <Route path="/batches" element={<ManageBatchesPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
