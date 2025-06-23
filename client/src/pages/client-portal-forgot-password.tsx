import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ClientPortalForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ resetToken?: string; resetUrl?: string } | null>(null);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forgotPasswordSchema>) => {
      const response = await apiRequest("POST", "/api/client-portal/forgot-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      setResetInfo(data);
    },
  });

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-slate-600">
              If an account with that email exists, we've sent you a password reset link.
            </p>
            
            {/* Demo purposes only - remove in production */}
            {resetInfo?.resetToken && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Demo Mode:</strong> Your reset link is: 
                  <a 
                    href={resetInfo.resetUrl} 
                    className="text-blue-600 underline ml-2"
                  >
                    Reset Password
                  </a>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/client-portal/login'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <p className="text-slate-600">Enter your email address and we'll send you a link to reset your password.</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => forgotPasswordMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        disabled={forgotPasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {forgotPasswordMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {forgotPasswordMutation.error.message || "Failed to send reset email"}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-sm"
                  onClick={() => window.location.href = '/client-portal/login'}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}