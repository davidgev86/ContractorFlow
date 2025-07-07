/**
 * Authentication Hook
 * 
 * This hook manages authentication state using React Query.
 * It fetches the current user data and provides authentication status.
 * 
 * Features:
 * - Current user data fetching
 * - Authentication state management
 * - Loading state handling
 * - Integration with Replit OAuth
 */

import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
