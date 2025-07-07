/**
 * Protected Route Component
 * 
 * This component provides route protection based on authentication and subscription status.
 * Handles redirects for unauthorized users and subscription requirements.
 * 
 * Features:
 * - Authentication state checking
 * - Subscription status validation
 * - Automatic redirects to login/pricing
 * - Loading states with spinner
 * - Toast notifications for user feedback
 * - Trial expiration handling
 */

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    // Check if user can access the app (subscription or trial)
    if (!isLoading && isAuthenticated && user && !user.canAccessApp) {
      toast({
        title: "Subscription Required",
        description: "Your trial has expired. Please upgrade to continue using ContractorFlow.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/pricing";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && !user.canAccessApp)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-slate-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
