/**
 * Authentication Utility Functions
 * 
 * This file contains utility functions for handling authentication-related operations.
 * Currently includes error checking for unauthorized requests.
 * 
 * Features:
 * - Error type detection for authentication failures
 * - Consistent error handling patterns
 */

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}