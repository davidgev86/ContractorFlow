import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

// Import pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Clients from "@/pages/clients";
import Reports from "@/pages/reports";
import Pricing from "@/pages/pricing";
import Checkout from "@/pages/checkout";
import ClientPortalLogin from "@/pages/client-portal-login";
import ClientPortalDashboard from "@/pages/client-portal-dashboard";
import ProjectUpdates from "@/pages/project-updates";
import ClientPortalSetup from "@/pages/client-portal-setup";
import ClientPortalForgotPassword from "@/pages/client-portal-forgot-password";
import ClientPortalResetPassword from "@/pages/client-portal-reset-password";
import Settings from "@/pages/settings";

import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={!isAuthenticated ? Landing : Dashboard} />
      <Route path="/pricing" component={Pricing} />
      {isAuthenticated && (
        <>
          <Route path="/projects" component={Projects} />
          <Route path="/clients" component={Clients} />
          <Route path="/reports" component={Reports} />
          <Route path="/project-updates" component={ProjectUpdates} />
          <Route path="/client-portal-setup" component={ClientPortalSetup} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      {/* Client Portal Routes - Public */}
      <Route path="/client-portal/login" component={ClientPortalLogin} />
      <Route path="/client-portal/dashboard" component={ClientPortalDashboard} />
      <Route path="/client-portal/forgot-password" component={ClientPortalForgotPassword} />
      <Route path="/client-portal/reset-password" component={ClientPortalResetPassword} />
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
