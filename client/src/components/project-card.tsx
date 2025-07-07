/**
 * Project Card Component
 * 
 * This component displays project information in a card format.
 * Used in project listings and dashboard views.
 * 
 * Features:
 * - Status badges with color coding
 * - Progress bar visualization
 * - Budget and due date display
 * - Responsive design
 * - Action buttons for project management
 */

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Hammer, 
  Wrench, 
  Calendar, 
  DollarSign, 
  ChevronRight 
} from "lucide-react";

interface ProjectCardProps {
  project: {
    id: number;
    name: string;
    status: string;
    budget?: string;
    progress?: number;
    dueDate?: string;
    clientId?: number;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "on_hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectIcon = (id: number) => {
    const icons = [Home, Hammer, Wrench];
    const Icon = icons[id % icons.length];
    return <Icon className="text-primary" />;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-600";
    if (progress >= 75) return "bg-accent";
    return "bg-primary";
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {getProjectIcon(project.id)}
            </div>
            <div>
              <h3 className="font-medium text-slate-800">{project.name}</h3>
              <p className="text-sm text-secondary">Project #{project.id}</p>
            </div>
          </div>
          
          <div className="mt-2 flex items-center space-x-4 text-sm text-secondary">
            {project.dueDate && (
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Due: {new Date(project.dueDate).toLocaleDateString()}
              </span>
            )}
            {project.budget && (
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                ${parseFloat(project.budget).toLocaleString()}
              </span>
            )}
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{project.progress || 0}%</p>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getProgressColor(project.progress || 0)}`}
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = '/projects'}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
