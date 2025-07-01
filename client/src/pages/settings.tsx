import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Link as LinkIcon, 
  Unlink, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Building,
  CreditCard,
  User,
  Crown
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // Get QuickBooks connection status
  const { data: qbStatus, isLoading: qbStatusLoading } = useQuery({
    queryKey: ["/api/quickbooks/status"],
    enabled: user?.planType === 'pro',
  });

  // Get QuickBooks company info if connected
  const { data: qbCompany } = useQuery({
    queryKey: ["/api/quickbooks/company"],
    enabled: qbStatus?.connected === true,
  });

  // Connect to QuickBooks mutation
  const connectMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/quickbooks/connect'),
    onSuccess: (data) => {
      setIsConnecting(true);
      // Redirect to QuickBooks authorization
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to QuickBooks",
        variant: "destructive",
      });
    },
  });

  // Disconnect from QuickBooks mutation
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/quickbooks/disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/company"] });
      toast({
        title: "Disconnected",
        description: "QuickBooks has been disconnected successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect QuickBooks",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect QuickBooks? This will stop all automatic syncing.")) {
      disconnectMutation.mutate();
    }
  };

  // Check if URL has quickbooks=connected parameter
  const urlParams = new URLSearchParams(window.location.search);
  const quickbooksConnected = urlParams.get('quickbooks') === 'connected';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <SettingsIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-600">Manage your account and integrations</p>
              </div>
            </div>

            {quickbooksConnected && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  QuickBooks has been connected successfully! You can now sync your projects and clients.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6">
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Account Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Name</label>
                      <p className="text-slate-900">{user?.firstName} {user?.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <p className="text-slate-900">{user?.email}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Current Plan</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={user?.planType === 'pro' ? 'default' : user?.planType === 'core' ? 'secondary' : 'outline'}>
                          {user?.planType === 'pro' && <Crown className="w-3 h-3 mr-1" />}
                          {user?.planType?.charAt(0).toUpperCase() + user?.planType?.slice(1)} Plan
                        </Badge>
                        {user?.planType === 'trial' && (
                          <span className="text-sm text-slate-600">
                            ({user?.trialDaysRemaining} days remaining)
                          </span>
                        )}
                      </div>
                    </div>
                    {user?.planType !== 'pro' && (
                      <Button onClick={() => window.location.href = '/pricing'}>
                        Upgrade Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* QuickBooks Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>QuickBooks Integration</span>
                    {user?.planType === 'pro' && (
                      <Badge variant="default" className="ml-2">
                        <Crown className="w-3 h-3 mr-1" />
                        Pro Feature
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user?.planType !== 'pro' ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        QuickBooks integration is available for Pro plan users only. 
                        <Button 
                          variant="link" 
                          className="p-0 h-auto ml-1"
                          onClick={() => window.location.href = '/pricing'}
                        >
                          Upgrade to Pro
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${qbStatus?.connected ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <div>
                            <p className="font-medium">
                              {qbStatus?.connected ? 'Connected' : 'Not Connected'}
                            </p>
                            {qbStatus?.connected && qbCompany && (
                              <p className="text-sm text-slate-600">
                                {qbCompany.QueryResponse?.CompanyInfo?.[0]?.CompanyName}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {qbStatusLoading ? (
                          <Button disabled>Loading...</Button>
                        ) : qbStatus?.connected ? (
                          <Button 
                            variant="outline" 
                            onClick={handleDisconnect}
                            disabled={disconnectMutation.isPending}
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        ) : (
                          <Button 
                            onClick={handleConnect}
                            disabled={connectMutation.isPending || isConnecting}
                          >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            {connectMutation.isPending || isConnecting ? 'Connecting...' : 'Connect to QuickBooks'}
                          </Button>
                        )}
                      </div>

                      {qbStatus?.connected && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-green-900">Connected Successfully</h4>
                              <p className="text-sm text-green-700 mt-1">
                                Your ContractorFlow projects and clients can now be synced with QuickBooks. 
                                Use the sync buttons in your project and client pages to send data to QuickBooks.
                              </p>
                              <div className="mt-3 space-y-1 text-sm text-green-700">
                                <p>✓ Sync clients as customers</p>
                                <p>✓ Sync projects as estimates</p>
                                <p>✓ Sync budget items as line items</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!qbStatus?.connected && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900">QuickBooks Integration Benefits</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                Connect your QuickBooks account to automatically sync:
                              </p>
                              <div className="mt-3 space-y-1 text-sm text-blue-700">
                                <p>• Customer information from your clients</p>
                                <p>• Project estimates with detailed line items</p>
                                <p>• Budget tracking and financial reporting</p>
                                <p>• Streamlined invoicing workflow</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Subscription</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {user?.planType === 'pro' ? 'Pro Plan' : 
                           user?.planType === 'core' ? 'Core Plan' : 
                           'Trial Plan'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {user?.planType === 'trial' 
                            ? `${user?.trialDaysRemaining} days remaining in trial`
                            : user?.subscriptionActive 
                              ? 'Active subscription'
                              : 'Subscription inactive'}
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = '/pricing'}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}