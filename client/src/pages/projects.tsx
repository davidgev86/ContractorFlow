import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/navigation";
import { TrialBanner } from "@/components/trial-banner";
import { ProtectedRoute } from "@/components/protected-route";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, insertTaskSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Search,
  Calendar,
  DollarSign,
  Users,
  MoreHorizontal,
  Home,
  Hammer,
  Wrench,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  FolderOpen,
  Send,
  Building
} from "lucide-react";
import { z } from "zod";

// Type definitions
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

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  budget?: string;
  progress?: number;
  clientId?: number;
  userId: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  userId: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  userId: string;
  status: string;
  priority: string;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  startDate?: string;
}

interface UpdateRequest {
  id: number;
  projectId: number;
  clientId: number;
  requestType: string;
  description: string;
  status: string;
  reply?: string;
  createdAt: string;
  client?: Client;
  project?: Project;
}

const projectFormSchema = insertProjectSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [replyTexts, setReplyTexts] = useState<{[key: number]: string}>({});
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDetailDialogOpen, setIsTaskDetailDialogOpen] = useState(false);

  const [taskNotes, setTaskNotes] = useState("");
  const [taskActualHours, setTaskActualHours] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<UpdateRequest[]>({
    queryKey: ["/api/update-requests"],
  });

  const { data: projectTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (data: Task[]) => selectedProjectForTasks ? data?.filter((task: Task) => task.projectId === selectedProjectForTasks) : [],
    enabled: !!selectedProjectForTasks,
  });

  const formSchema = insertProjectSchema.extend({
    budget: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    dueDate: z.string().optional(),
  });

  const taskFormSchema = insertTaskSchema.extend({
    projectId: z.number(),
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      siteAddress: "",
      status: "planning",
      budget: "",
      progress: 0,
      userId: "",
      clientId: undefined,
      startDate: "",
      endDate: "",
      dueDate: "",
    },
  });

  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      projectId: selectedProjectForTasks || 0,
      userId: (user as any)?.id || "",
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      assignedTo: "",
      estimatedHours: 0,
      dueDate: "",
      startDate: "",
    },
  });

  // Update task form when project selection or user changes
  React.useEffect(() => {
    if (selectedProjectForTasks) {
      taskForm.setValue('projectId', selectedProjectForTasks);
    }
    if (user?.id) {
      taskForm.setValue('userId', user.id);
    }
  }, [selectedProjectForTasks, user?.id, taskForm]);

  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof projectFormSchema>) => {
      await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error) => {
      console.error("Project creation error:", error);
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
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Project deletion error:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsEditDialogOpen(false);
      setEditingProject(null);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error) => {
      console.error("Project update error:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/projects/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Project status updated successfully",
      });
    },
    onError: (error) => {
      console.error("Project status update error:", error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
    },
    onError: (error) => {
      console.error("Task status update error:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    },
  });

  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `/api/update-requests/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/update-requests"] });
      toast({
        title: "Success",
        description: "Request status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    },
  });

  const syncToQuickBooksMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return apiRequest("POST", `/api/quickbooks/sync-project/${projectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project synced to QuickBooks successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync project to QuickBooks",
        variant: "destructive",
      });
    },
  });

  const editForm = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      budget: "",
      progress: 0,
      userId: "",
      clientId: undefined,
      startDate: "",
      endDate: "",
      dueDate: "",
    },
  });

  const filteredProjects = projects?.filter((project: any) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "reviewed":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 border-red-200";
      case "high":
        return "text-orange-600 border-orange-200";
      case "medium":
        return "text-blue-600 border-blue-200";
      case "low":
        return "text-gray-600 border-gray-200";
      default:
        return "text-gray-600 border-gray-200";
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    updateRequestStatusMutation.mutate({ id, status });
  };

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: number; reply: string }) => {
      return apiRequest("PUT", `/api/update-requests/${id}/reply`, { reply });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/update-requests"] });
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  const handleSendReply = (id: number, reply: string) => {
    if (reply.trim()) {
      replyMutation.mutate({ id, reply });
    }
  };

  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof taskFormSchema>) => {
      console.log('Creating task with data:', data);
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      console.log('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsTaskDialogOpen(false);
      taskForm.reset();
      // Reset project selection after task creation
      if (selectedProjectForTasks) {
        taskForm.setValue('projectId', selectedProjectForTasks);
      }
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error) => {
      console.error('Task creation error:', error);
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
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const onTaskSubmit = (data: z.infer<typeof taskFormSchema>) => {
    console.log('Task form submitted:', data);
    console.log('Selected project ID:', selectedProjectForTasks);
    
    if (!selectedProjectForTasks) {
      console.error('No project selected for task creation');
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }
    
    createTaskMutation.mutate({
      ...data,
      projectId: selectedProjectForTasks,
    });
  };

  const getProjectIcon = (index: number) => {
    const icons = [Home, Hammer, Wrench];
    const Icon = icons[index % icons.length];
    return <Icon className="w-5 h-5" />;
  };

  const onSubmit = (data: z.infer<typeof projectFormSchema>) => {
    console.log("Submitting project data:", data);
    // Keep dates as strings for API compatibility
    createProjectMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof projectFormSchema>) => {
    if (!editingProject) return;
    // Keep dates as strings for API compatibility
    updateProjectMutation.mutate({ id: editingProject.id, data });
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    editForm.reset({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "planning",
      budget: project.budget || "",
      progress: project.progress || 0,
      userId: project.userId || "",
      clientId: project.clientId || undefined,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleViewProject = (project: any) => {
    toast({
      title: "Project Details",
      description: `${project.name} - Status: ${project.status}`,
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <TrialBanner />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
              <p className="text-slate-600 mt-1">Manage your construction projects and client requests</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Kitchen Remodel - Johnson Home" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients?.map((client: any) => (
                                  <SelectItem key={client.id} value={client.id.toString()}>
                                    {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Complete kitchen renovation including..."
                                className="resize-none"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="siteAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="123 Main Street, Anytown, NY 12345"
                                className="resize-none"
                                rows={2}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="12500" 
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createProjectMutation.isPending}>
                          {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Project Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Kitchen Remodel - Johnson Home" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <Input placeholder="15000" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateProjectMutation.isPending}>
                        {updateProjectMutation.isPending ? "Updating..." : "Update Project"}
                      </Button>
                    </div>
                  </form>
                </Form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="projects" className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4" />
                <span>Projects</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Client Requests</span>
                {requests && Array.isArray(requests) && requests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6">
              {/* Search and Filters */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Projects Grid */}
              {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded"></div>
                      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Home className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No projects found</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first project"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: any, index: number) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getProjectIcon(index)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                          <p className="text-sm text-slate-600 truncate">Client Project</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProject(project)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedProjectForTasks(project.id)}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Manage Tasks
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProject(project)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this project?")) {
                                deleteProjectMutation.mutate(project.id);
                              }
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Status</span>
                        <Select
                          value={project.status}
                          onValueChange={(status) => updateProjectStatusMutation.mutate({ id: project.id, status })}
                        >
                          <SelectTrigger className="w-32 h-7">
                            <SelectValue>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {project.budget && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Budget</span>
                          <span className="font-medium">${parseFloat(project.budget).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {project.dueDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Due Date</span>
                          <span className="font-medium">
                            {new Date(project.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-600">Progress</span>
                          <span className="text-xs font-medium">{project.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProjectForTasks(project.id);
                            setActiveTab("tasks");
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Manage Tasks
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              {selectedProjectForTasks ? (
                <div className="bg-white">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800 mb-2">
                        Project Tasks
                      </h2>
                      <p className="text-slate-600">
                        Manage tasks for Project ID: {selectedProjectForTasks}
                      </p>
                    </div>
                    <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Create New Task</DialogTitle>
                        </DialogHeader>
                        <Form {...taskForm}>
                          <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
                            <FormField
                              control={taskForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Task Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Install kitchen cabinets" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={taskForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Detailed task description..."
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={taskForm.control}
                                name="status"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="blocked">Blocked</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={taskForm.control}
                                name="priority"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={taskForm.control}
                                name="assignedTo"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Assigned To</FormLabel>
                                    <FormControl>
                                      <Input placeholder="John Smith" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={taskForm.control}
                                name="estimatedHours"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Estimated Hours</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="8" 
                                        {...field}
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={taskForm.control}
                                name="startDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={taskForm.control}
                                name="dueDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Due Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createTaskMutation.isPending}>
                                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Tasks List */}
                  {tasksLoading ? (
                    <div className="grid gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-200 rounded"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : projectTasks?.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600 mb-2">No tasks yet</h3>
                        <p className="text-slate-500 mb-4">
                          Create your first task to start managing project work.
                        </p>
                        <Button onClick={() => setIsTaskDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Task
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {projectTasks?.map((task: any) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
                                <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                                  <Select
                                    value={task.status}
                                    onValueChange={(status) => updateTaskStatusMutation.mutate({ id: task.id, status })}
                                  >
                                    <SelectTrigger className="w-32 h-7">
                                      <SelectValue>
                                        <Badge className={getTaskStatusColor(task.status)}>
                                          {task.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                        </Badge>
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="blocked">Blocked</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Badge variant="outline" className={getTaskPriorityColor(task.priority)}>
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                                  </Badge>
                                  {task.assignedTo && (
                                    <span className="flex items-center">
                                      <User className="w-4 h-4 mr-1" />
                                      {task.assignedTo}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {task.description && (
                                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">
                                  {task.description}
                                </p>
                              )}

                              {(task.estimatedHours || task.actualHours) && (
                                <div className="flex items-center space-x-4 text-sm">
                                  {task.estimatedHours && (
                                    <span className="text-slate-600">
                                      Estimated: {task.estimatedHours}h
                                    </span>
                                  )}
                                  {task.actualHours && (
                                    <span className="text-slate-600">
                                      Actual: {task.actualHours}h
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-sm text-slate-500">
                                  Created: {new Date(task.createdAt).toLocaleDateString()}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsTaskDetailDialogOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Select a project to manage tasks</h3>
                  <p className="text-slate-600 mb-4">
                    Click "Manage Tasks" on any project card to view and manage its tasks
                  </p>
                  <Button onClick={() => setActiveTab("projects")}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    View Projects
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              {requestsLoading ? (
                <div className="grid gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !requests || !Array.isArray(requests) || requests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-600 mb-2">No client requests yet</h3>
                    <p className="text-slate-500">
                      Client update requests will appear here when submitted through the client portal.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {Array.isArray(requests) && requests.map((request: any) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{request.title}</CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                              <span className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {request.clientName}
                              </span>
                              <span className="flex items-center">
                                <FolderOpen className="w-4 h-4 mr-1" />
                                {request.projectName}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(request.status)}
                            <Badge className={getRequestStatusColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {request.description && (
                            <div>
                              <h4 className="font-medium text-slate-700 mb-2">Details:</h4>
                              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">
                                {request.description}
                              </p>
                            </div>
                          )}

                          {request.contractorReply && (
                            <div className="pt-4 border-t">
                              <h4 className="font-medium text-slate-700 mb-2">Your Reply:</h4>
                              <p className="text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                {request.contractorReply}
                              </p>
                            </div>
                          )}
                          
                          <div className="pt-4 border-t space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-slate-500">
                                Requested by: {request.requestedBy}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-slate-700">Status:</span>
                                <Select
                                  value={request.status}
                                  onValueChange={(status) => handleStatusChange(request.id, status)}
                                  disabled={updateRequestStatusMutation.isPending}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Reply to Client:</label>
                              <div className="flex space-x-2">
                                <Textarea
                                  placeholder="Type your response to the client..."
                                  value={replyTexts[request.id] || ''}
                                  onChange={(e) => setReplyTexts(prev => ({
                                    ...prev,
                                    [request.id]: e.target.value
                                  }))}
                                  className="flex-1 min-h-[80px]"
                                />
                                <Button
                                  onClick={() => {
                                    handleSendReply(request.id, replyTexts[request.id] || '');
                                    setReplyTexts(prev => ({
                                      ...prev,
                                      [request.id]: ''
                                    }));
                                  }}
                                  disabled={!replyTexts[request.id]?.trim() || replyMutation.isPending}
                                  size="sm"
                                  className="self-end"
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Send
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Task Management Dialog - Disabled since we're using tabs instead */}
        <Dialog open={false} onOpenChange={() => {}}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Project Tasks</DialogTitle>
              <DialogDescription>
                Manage tasks for this project. Create, view, and track task progress.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tasks for Project</h3>
                <Button 
                  onClick={() => {
                    console.log('Add Task button clicked');
                    if (selectedProjectForTasks) {
                      taskForm.setValue('projectId', selectedProjectForTasks);
                    }
                    if (user?.id) {
                      taskForm.setValue('userId', user.id);
                    }
                    setIsTaskDialogOpen(true);
                  }}
                  type="button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {tasksLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border rounded p-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : projectTasks?.length ? (
                <div className="space-y-4">
                  {projectTasks.map((task: any) => (
                    <Card key={task.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                            {task.description && (
                              <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={
                              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {task.priority}
                            </Badge>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {task.assignedTo && (
                            <div>
                              <span className="font-medium text-slate-700">Assigned:</span>
                              <p className="text-slate-600">{task.assignedTo}</p>
                            </div>
                          )}
                          {task.dueDate && (
                            <div>
                              <span className="font-medium text-slate-700">Due:</span>
                              <p className="text-slate-600">{new Date(task.dueDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          {task.estimatedHours && (
                            <div>
                              <span className="font-medium text-slate-700">Est. Hours:</span>
                              <p className="text-slate-600">{task.estimatedHours}h</p>
                            </div>
                          )}
                          {task.startDate && (
                            <div>
                              <span className="font-medium text-slate-700">Start:</span>
                              <p className="text-slate-600">{new Date(task.startDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">No tasks yet</h3>
                  <p className="text-slate-500 mb-4">Create your first task to get started</p>
                  <Button 
                    onClick={() => {
                      console.log('Add Task button clicked (empty state)');
                      if (selectedProjectForTasks) {
                        taskForm.setValue('projectId', selectedProjectForTasks);
                      }
                      if (user?.id) {
                        taskForm.setValue('userId', user.id);
                      }
                      setIsTaskDialogOpen(true);
                    }}
                    type="button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Task Dialog */}
        <Dialog 
          open={isTaskDialogOpen} 
          onOpenChange={(open) => {
            console.log('Task dialog state changed:', open);
            setIsTaskDialogOpen(open);
            if (!open) {
              taskForm.reset();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to this project with priority, scheduling, and assignment details.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <Form {...taskForm}>
                <form 
                  onSubmit={(e) => {
                    console.log('Form submit event triggered');
                    e.preventDefault();
                    taskForm.handleSubmit(onTaskSubmit)(e);
                  }} 
                  className="space-y-4"
                >
                <FormField
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={taskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Task description" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={taskForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taskForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={taskForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input placeholder="Name or email" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={taskForm.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            value={field.value?.toString() ?? ""}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taskForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={taskForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTaskMutation.isPending}
                    onClick={() => console.log('Create Task button clicked', taskForm.formState.errors)}
                  >
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
