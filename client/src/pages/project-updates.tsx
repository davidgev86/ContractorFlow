import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/navigation";
import { TrialBanner } from "@/components/trial-banner";
import { ProtectedRoute } from "@/components/protected-route";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Camera, 
  FileText, 
  Calendar,
  Eye,
  EyeOff,
  Upload,
  X
} from "lucide-react";

const updateFormSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isVisibleToClient: z.boolean().default(true),
});

export default function ProjectUpdates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: updates, isLoading: updatesLoading } = useQuery({
    queryKey: ["/api/project-updates"],
  });

  const form = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      isVisibleToClient: true,
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateFormSchema>) => {
      const response = await apiRequest("POST", "/api/project-updates", data);
      return response.json();
    },
    onSuccess: async (update) => {
      // Upload photos if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("photo", file);
          formData.append("updateId", update.id.toString());
          formData.append("caption", file.name);
          
          await fetch("/api/project-updates/photos", {
            method: "POST",
            body: formData,
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/project-updates"] });
      setIsDialogOpen(false);
      setSelectedFiles([]);
      form.reset();
      toast({
        title: "Success",
        description: "Project update created successfully",
      });
    },
    onError: (error) => {
      console.error("Update creation error:", error);
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
        description: `Failed to create update: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof updateFormSchema>) => {
    createUpdateMutation.mutate(data);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <TrialBanner />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Project Updates</h1>
              <p className="text-slate-600 mt-1">Share progress updates and photos with clients</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Update
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Project Update</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects?.map((project: any) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
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
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Update Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Progress update title" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the progress made on this project..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Photo Upload */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Progress Photos</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload photos</span>
                        </label>
                      </div>
                      
                      {selectedFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="isVisibleToClient"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Visible to Client
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Allow client to see this update in their portal
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createUpdateMutation.isPending}>
                        {createUpdateMutation.isPending ? "Creating..." : "Create Update"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Updates List */}
          <div className="space-y-6">
            {updatesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : updates?.length ? (
              updates.map((update: any) => (
                <Card key={update.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{update.title}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          {update.projectName} • {new Date(update.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {update.isVisibleToClient ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Visible to Client
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Internal Only
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {(update.description || update.photos?.length > 0) && (
                    <CardContent>
                      {update.description && (
                        <p className="text-slate-700 mb-4">{update.description}</p>
                      )}
                      
                      {update.photos?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Camera className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">
                              Photos ({update.photos.length})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {update.photos.map((photo: any) => (
                              <div key={photo.id} className="relative group">
                                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                  <img
                                    src={`/api/project-updates/photos/${photo.fileName}`}
                                    alt={photo.caption || "Project photo"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
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
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first project update to share progress with clients.</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Update
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}