import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Clock, X } from "lucide-react";

export function TrialBanner() {
  const { user } = useAuth();

  if (!user?.isTrialActive || user?.subscriptionActive) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white border-b border-blue-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-200" />
            <span className="font-semibold text-white">
              Free Trial - {user.trialDaysRemaining} days remaining
            </span>
            <span className="ml-2 text-blue-100 hidden sm:inline font-medium">
              Upgrade now to continue using all features
            </span>
          </div>
          <div className="mt-2 sm:mt-0 flex space-x-2">
            <Link href="/pricing">
              <Button 
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-sm"
              >
                View Plans
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-100 hover:text-white hover:bg-blue-500/30 border border-blue-400/30"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
