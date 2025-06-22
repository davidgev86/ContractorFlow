import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CheckCircle, X } from "lucide-react";
import { useLocation } from "wouter";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [includeOnboarding, setIncludeOnboarding] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planType }: { planType: string }) => {
      const response = await apiRequest("POST", "/api/create-subscription", {
        planType,
        includeOnboarding,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to checkout with client secret
      setLocation(`/checkout?clientSecret=${data.clientSecret}&subscriptionId=${data.subscriptionId}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planType: "core" | "pro") => {
    createSubscriptionMutation.mutate({ planType });
  };

  const corePrice = isAnnual ? "$250" : "$25";
  const proPrice = isAnnual ? "$350" : "$35";
  const corePeriod = isAnnual ? "/year" : "/month";
  const proPeriod = isAnnual ? "/year" : "/month";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Choose Your Plan</h1>
            <p className="text-lg text-slate-600 mb-8">
              Upgrade your account to continue using ContractorFlow
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className="text-sm font-medium text-slate-700 mr-3">Monthly</span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="mx-3"
              />
              <span className="text-sm font-medium text-slate-700 ml-3">
                Annual <span className="text-green-600 font-semibold">(Save 2 months!)</span>
              </span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Core Plan */}
            <Card className="border-gray-200 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Core Plan</CardTitle>
                <p className="text-slate-600">Perfect for small contractors</p>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-slate-800">{corePrice}</span>
                    <span className="text-slate-600 ml-1">{corePeriod}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">+ $199 setup fee</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">Job scheduling & task assignments</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">Budget tracking (materials & labor)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">Client portals</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">Mobile-friendly dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">Multiple users (no per-user fees)</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full"
                  onClick={() => handleSelectPlan("core")}
                  disabled={createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending ? "Processing..." : "Choose Core Plan"}
                </Button>
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Pro Plan</CardTitle>
                <p className="text-slate-600">For growing contractors</p>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-slate-800">{proPrice}</span>
                    <span className="text-slate-600 ml-1">{proPeriod}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">+ $199 setup fee</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">Everything in Core Plan</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm font-semibold text-primary">QuickBooks integration (two-way sync)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">Advanced reporting</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full bg-primary hover:bg-blue-700"
                  onClick={() => handleSelectPlan("pro")}
                  disabled={createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending ? "Processing..." : "Choose Pro Plan"}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Add-on */}
          <Card className="bg-yellow-50 border-yellow-200 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-slate-800">Concierge Onboarding</h4>
                  <p className="text-sm text-slate-600">Guided setup, project import, and live training session</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">$200</p>
                  <p className="text-xs text-slate-600">one-time</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="onboarding"
                  checked={includeOnboarding}
                  onCheckedChange={setIncludeOnboarding}
                />
                <label htmlFor="onboarding" className="text-sm text-slate-700 cursor-pointer">
                  Add Concierge Onboarding to my plan
                </label>
              </div>
            </CardContent>
          </Card>
          
          {/* Guarantee */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              All plans include a 14-day free trial and 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
