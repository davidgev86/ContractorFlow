import { useEffect, useState } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to ContractorFlow! Your subscription is now active.",
      });
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Subscription</CardTitle>
          <p className="text-center text-slate-600">
            Secure payment processed by Stripe
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!stripe || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Payment"
              )}
            </Button>
            
            <p className="text-xs text-center text-slate-500">
              By completing this payment, you agree to our terms of service. 
              Your subscription will begin immediately.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Get client secret from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const secret = urlParams.get('clientSecret');
    
    if (secret) {
      setClientSecret(secret);
    } else {
      toast({
        title: "Error",
        description: "Invalid checkout session. Please try again.",
        variant: "destructive",
      });
      // Redirect back to pricing
      setTimeout(() => {
        window.location.href = "/pricing";
      }, 2000);
    }
  }, [toast]);

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Payment processing is not available.</p>
            <Button 
              className="mt-4"
              onClick={() => window.location.href = "/dashboard"}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
