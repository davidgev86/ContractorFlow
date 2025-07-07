/**
 * Utility Functions
 * 
 * This file contains common utility functions used throughout the application.
 * Currently includes the cn() function for conditional class name merging.
 * 
 * Features:
 * - Class name merging with Tailwind CSS support
 * - Conditional class application
 * - Optimized for use with shadcn/ui components
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
