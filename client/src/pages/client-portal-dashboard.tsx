import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useClientPortalAuth, clientPortalRequest } from "@/hooks/useClientPortalAuth";
import { 
  Calendar, 
  Camera, 
  FileText, 
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  MessageSquare,
  Plus
} from "lucide-react";

const requestUpdateSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
});

export default function ClientPortalDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { user: clientData, isLoading: clientLoading } = useClientPortalAuth();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["client-portal-projects"],
    queryFn: () => clientPortalRequest("/projects"),
    enabled: !!clientData,
  });

  const { data: updates, isLoading: updatesLoading } = useQuery({
    queryKey: ["client-portal-updates"],
    queryFn: () => clientPortalRequest("/updates"),
    enabled: !!clientData,
  });

  const { data: updateRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["client-portal-update-requests"],
    queryFn: () => clientPortalRequest("/update-requests"),
    enabled: !!clientData,
  });

  const form = useForm<z.infer<typeof requestUpdateSchema>>({
    resolver: zodResolver(requestUpdateSchema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof requestUpdateSchema>) => {
      return await clientPortalRequest("/request-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-portal-update-requests"] });
      setIsRequestDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Update request submitted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit update request",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("clientPortalToken");
    window.location.href = "/client-portal/login";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "planning":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "reviewed":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">
                  Welcome, {clientData?.name || "Client"}
                </h1>
                <p className="text-sm text-slate-600">Project Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Request Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Project Update</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createRequestMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                  {projects?.map((project: any) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Request Title</FormLabel>
                            <FormControl>
                              <Input placeholder="What would you like to know?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Provide additional details about your request..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsRequestDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createRequestMutation.isPending}>
                          {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Projects</h2>
          
          {projectsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          ) : projects?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: any) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {getStatusIcon(project.status)}
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.description && (
                        <p className="text-sm text-slate-600">{project.description}</p>
                      )}
                      
                      {project.progress !== undefined && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      )}
                      
                      {project.dueDate && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Due: {new Date(project.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
                <p className="text-gray-600">Your projects will appear here once they are created.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Update Requests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Update Requests</h2>
          
          {requestsLoading ? (
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b pb-4 last:border-b-0">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : updateRequests?.length ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {updateRequests.map((request: any) => (
                    <div key={request.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-1">{request.title}</h3>
                          <p className="text-sm text-slate-600 mb-2">{request.description}</p>
                          
                          {request.contractorReply && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-xs font-medium text-blue-700 mb-1">Contractor Reply:</div>
                              <div className="text-sm text-blue-800">{request.contractorReply}</div>
                            </div>
                          )}
                          

                          
                          <p className="text-xs text-slate-500 mt-2">
                            Project: {request.projectName} • {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="font-medium text-slate-600 mb-2">No update requests yet</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Click "Request Update" to ask your contractor for project information.
                </p>
                <Button onClick={() => setIsRequestDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Request Update
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Updates */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Updates</h2>
          
          {updatesLoading ? (
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b pb-4 last:border-b-0">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : updates?.length ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {updates.map((update: any) => (
                    <div key={update.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-slate-800">{update.title}</h3>
                        <span className="text-sm text-slate-500">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {update.description && (
                        <p className="text-slate-600 mb-4">{update.description}</p>
                      )}
                      
                      {update.photos?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Camera className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">
                              Progress Photos ({update.photos.length})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {update.photos?.map((photo: any, index: number) => (
                              <div key={photo.id || index} className="relative group cursor-pointer">
                                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                                  <img
                                    src={`/api/project-updates/photos/${photo.fileName}`}
                                    alt={photo.caption || "Project photo"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
                                    <div className="text-center">
                                      <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                      <p className="text-xs text-gray-600">Progress Photo</p>
                                    </div>
                                  </div>
                                </div>
                                {photo.caption && (
                                  <p className="text-xs text-slate-600 mt-1 truncate">
                                    {photo.caption}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates Yet</h3>
                <p className="text-gray-600">Project updates and photos will appear here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}