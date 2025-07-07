/**
 * Task Item Component
 * 
 * This component displays individual task information with interactive controls.
 * Supports task completion tracking and status updates.
 * 
 * Features:
 * - Checkbox for task completion
 * - Priority and status badges
 * - Real-time status updates
 * - Error handling with toast notifications
 * - Optimistic UI updates
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface TaskItemProps {
  task: {
    id: number;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignedTo?: string;
  };
}

export function TaskItem({ task }: TaskItemProps) {
  const [isCompleted, setIsCompleted] = useState(task.status === "completed");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PUT", `/api/tasks/${task.id}`, {
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      // Revert the checkbox state
      setIsCompleted(!isCompleted);
    },
  });

  const handleCheckboxChange = (checked: boolean) => {
    setIsCompleted(checked);
    const newStatus = checked ? "completed" : "pending";
    updateTaskMutation.mutate(newStatus);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center space-x-3">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleCheckboxChange}
        disabled={updateTaskMutation.isPending}
        className="h-5 w-5"
      />
      <div className="flex-1">
        <p className={`font-medium ${
          isCompleted 
            ? "line-through text-secondary" 
            : "text-slate-800"
        }`}>
          {task.title}
        </p>
        <div className="flex items-center space-x-2 text-sm text-secondary">
          {task.dueDate && (
            <span>
              {isCompleted 
                ? `Completed at ${formatTime(task.dueDate)}`
                : `Due: ${formatTime(task.dueDate)}`
              }
            </span>
          )}
          {task.assignedTo && (
            <>
              <span>•</span>
              <span>Assigned to: {task.assignedTo}</span>
            </>
          )}
        </div>
      </div>
      <Badge className={
        isCompleted 
          ? "bg-green-100 text-green-800"
          : getPriorityColor(task.priority)
      }>
        {isCompleted 
          ? "Complete"
          : task.priority.charAt(0).toUpperCase() + task.priority.slice(1) + " Priority"
        }
      </Badge>
    </div>
  );
}
