/**
 * Client Portal Authentication Hook
 * 
 * This hook manages authentication state for the client portal using JWT tokens.
 * It provides separate authentication from the main contractor authentication.
 * 
 * Features:
 * - JWT token management in localStorage
 * - Client profile fetching
 * - Authentication status tracking
 * - Automatic token inclusion in requests
 */

import { useQuery } from "@tanstack/react-query";

const CLIENT_PORTAL_API_BASE = "/api/client-portal";

async function clientPortalRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("clientPortalToken");
  
  const response = await fetch(`${CLIENT_PORTAL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useClientPortalAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["client-portal-auth"],
    queryFn: () => clientPortalRequest("/profile"),
    retry: false,
    enabled: !!localStorage.getItem("clientPortalToken"),
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

export { clientPortalRequest };