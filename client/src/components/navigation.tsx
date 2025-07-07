/**
 * Navigation Component
 * 
 * This component provides the main navigation interface for the application.
 * It includes both desktop and mobile navigation with responsive design.
 * 
 * Features:
 * - Responsive navigation with mobile menu
 * - Active route highlighting
 * - User profile display
 * - Trial status indicator
 * - Authentication-aware navigation items
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// Type definition for user
interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  planType?: string;
  subscriptionActive?: boolean;
  isTrialActive?: boolean;
  trialDaysRemaining?: number;
}
import { 
  HardHat, 
  Menu, 
  X,
  LayoutDashboard,
  FolderOpen,
  Users,
  BarChart3,
  FileText,
  ExternalLink,
  MessageSquare,
  Settings,
  DollarSign
} from "lucide-react";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth() as { user: User | null };

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/projects", label: "Projects", icon: FolderOpen },
    { path: "/clients", label: "Clients", icon: Users },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/project-updates", label: "Updates", icon: FileText },
    { path: "/progress-billing", label: "Progress Billing", icon: DollarSign },
    { path: "/client-portal-setup", label: "Portal", icon: ExternalLink },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <HardHat className="text-primary text-2xl mr-2" />
              <span className="font-bold text-xl text-slate-800">FieldContractorFlow</span>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span
                    className={`${
                      isActive(item.path)
                        ? "text-primary border-b-2 border-primary"
                        : "text-slate-700 hover:text-slate-900"
                    } px-1 pt-1 pb-4 text-sm font-medium transition-colors cursor-pointer`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              {user?.isTrialActive && !user?.subscriptionActive && (
                <>
                  <span className="text-sm text-slate-700 font-medium">
                    Trial: {user.trialDaysRemaining} days left
                  </span>
                  <Link href="/pricing">
                    <Button size="sm" className="bg-warning hover:bg-orange-600 text-white">
                      Upgrade Now
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl && (
                <img 
                  className="h-8 w-8 rounded-full object-cover" 
                  src={user.profileImageUrl} 
                  alt="User avatar"
                />
              )}
              <span className="hidden md:block text-sm font-medium text-slate-700">
                {user?.firstName || 'User'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="hidden md:inline-flex"
              >
                Logout
              </Button>
            </div>
            
            <button 
              className="md:hidden text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="text-xl" /> : <Menu className="text-xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`${
                      isActive(item.path)
                        ? "text-primary bg-blue-50"
                        : "text-slate-700 hover:bg-gray-50"
                    } flex items-center px-3 py-2 rounded-md font-medium cursor-pointer`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
            
            {/* Mobile trial info */}
            {user?.isTrialActive && !user?.subscriptionActive && (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-slate-700 font-medium">
                    Trial: {user.trialDaysRemaining} days left
                  </span>
                  <Link href="/pricing">
                    <Button 
                      size="sm" 
                      className="bg-warning hover:bg-orange-600 text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Upgrade
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            <div className="pt-2 mt-2 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/api/logout'}
                className="w-full justify-start text-slate-600"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
