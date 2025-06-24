import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/navigation";
import { TrialBanner } from "@/components/trial-banner";
import { ProtectedRoute } from "@/components/protected-route";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/schema";
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
  Send
} from "lucide-react";
import { z } from "zod";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/update-requests"],
  });

  const updateStatusMutation = useMutation({
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

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const form = useForm<z.infer<typeof projectFormSchema>>({
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
    updateStatusMutation.mutate({ id, status });
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

  const getProjectIcon = (index: number) => {
    const icons = [Home, Hammer, Wrench];
    const Icon = icons[index % icons.length];
    return <Icon className="w-5 h-5" />;
  };

  const onSubmit = (data: z.infer<typeof projectFormSchema>) => {
    console.log("Submitting project data:", data);
    // Convert string dates to Date objects if they exist
    const formattedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };
    createProjectMutation.mutate(formattedData);
  };

  const onEditSubmit = (data: z.infer<typeof projectFormSchema>) => {
    if (!editingProject) return;
    
    const formattedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };
    updateProjectMutation.mutate({ id: editingProject.id, data: formattedData });
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
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
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
                            <Input type="number" placeholder="12500" {...field} />
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
              </DialogContent>
            </Dialog>

            {/* Edit Project Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                            <Input placeholder="15000" {...field} />
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
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects" className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4" />
                <span>Projects</span>
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
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                          
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-slate-500">
                              Requested by: {request.requestedBy}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-slate-700">Update Status:</span>
                              <Select
                                value={request.status}
                                onValueChange={(status) => handleStatusChange(request.id, status)}
                                disabled={updateStatusMutation.isPending}
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
