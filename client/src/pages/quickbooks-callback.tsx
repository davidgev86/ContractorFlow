import { useEffect } from "react";
import { useLocation } from "wouter";

export default function QuickBooksCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // The OAuth callback is handled by the backend at /api/quickbooks/callback
    // This component just shows a loading state while the redirect happens
    // The backend will redirect to /settings after processing
    const timer = setTimeout(() => {
      navigate("/settings");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Connecting to QuickBooks</h2>
        <p className="text-slate-600">Please wait while we complete the connection...</p>
      </div>
    </div>
  );
}