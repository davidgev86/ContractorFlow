import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Camera, DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { insertProgressBillingMilestoneSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const milestoneFormSchema = insertProgressBillingMilestoneSchema.extend({
  projectId: z.number(),
}).omit({
  completedAt: true,
  userId: true,
});

type MilestoneFormData = z.infer<typeof milestoneFormSchema>;

const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800", 
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800",
  paid: "bg-emerald-100 text-emerald-800"
};

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  invoiced: DollarSign,
  paid: CheckCircle
};

export default function ProgressBilling() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [milestonePhotos, setMilestonePhotos] = useState<{[key: number]: any[]}>({});
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch milestones for selected project
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["/api/progress-billing/milestones", selectedProject],
    enabled: !!selectedProject,
  });

  // Initialize photos from loaded milestones
  useEffect(() => {
    if (Array.isArray(milestones) && milestones.length > 0) {
      const photosMap: {[key: number]: any[]} = {};
      milestones.forEach((milestone: any) => {
        if (milestone.photos) {
          photosMap[milestone.id] = milestone.photos;
        }
      });
      setMilestonePhotos(photosMap);
    }
  }, [milestones]);

  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: "",
      description: "",
      percentage: 0,
      amount: "",
      status: "pending",
      requiresPhotos: true,
      minPhotosRequired: 3,
      photoInstructions: "",
      projectId: 0,
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (data: MilestoneFormData) => {
      const response = await fetch("/api/progress-billing/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create milestone");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress-billing/milestones"] });
      setIsCreateOpen(false);
      form.reset();
    },
  });

  const updateMilestoneStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/progress-billing/milestones/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update milestone status");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress-billing/milestones"] });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ milestoneId, file }: { milestoneId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('milestoneId', milestoneId.toString());
      
      const response = await fetch('/api/progress-billing/photos', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update local state with new photo
      setMilestonePhotos(prev => ({
        ...prev,
        [variables.milestoneId]: [...(prev[variables.milestoneId] || []), data]
      }));
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/progress-billing/photos/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
    },
    onSuccess: (_, photoId) => {
      // Remove photo from local state
      setMilestonePhotos(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(milestoneId => {
          updated[parseInt(milestoneId)] = updated[parseInt(milestoneId)].filter(
            photo => photo.id !== photoId
          );
        });
        return updated;
      });
    },
  });

  const handlePhotoUpload = async (milestoneId: number, files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      uploadPhotoMutation.mutate({ milestoneId, file });
    });
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isCreateOpen && selectedProject) {
      form.reset({
        title: "",
        description: "",
        percentage: 0,
        amount: "",
        status: "pending",
        requiresPhotos: true,
        minPhotosRequired: 3,
        photoInstructions: "",
        projectId: selectedProject,
      });
    }
  }, [isCreateOpen, selectedProject, form]);

  const onSubmit = (data: MilestoneFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Selected project:", selectedProject);
    console.log("Form validation errors:", form.formState.errors);
    
    if (!selectedProject) {
      console.error("No project selected");
      return;
    }
    
    createMilestoneMutation.mutate({
      ...data,
      projectId: selectedProject,
    });
  };

  const selectedProjectName = Array.isArray(projects) ? projects.find((p: any) => p.id === selectedProject)?.name : undefined;
  const totalProgress = Array.isArray(milestones) ? milestones.reduce((sum: number, m: any) => 
    m.status === 'completed' || m.status === 'paid' ? sum + m.percentage : sum, 0) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Progress Billing</h1>
          <p className="text-muted-foreground">
            Photo-backed progress billing with QuickBooks integration
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedProject}>
              <Plus className="w-4 h-4 mr-2" />
              New Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Progress Milestone</DialogTitle>
              <DialogDescription>
                Create a new milestone for photo-backed progress billing with QuickBooks integration.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  console.log("Form validation failed:", errors);
                })} 
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milestone Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Foundation Complete" {...field} />
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
                          placeholder="Describe what work is included..." 
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
                    control={form.control}
                    name="percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progress %</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input placeholder="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="photoInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Take photos from north, south, east, and west sides showing foundation completion..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMilestoneMutation.isPending}
                    onClick={() => {
                      console.log("Button clicked!");
                      console.log("Form errors:", form.formState.errors);
                      console.log("Form values:", form.getValues());
                      console.log("Form valid:", form.formState.isValid);
                    }}
                  >
                    Create Milestone
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>Choose a project to manage progress billing milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedProject?.toString()} 
            onValueChange={(value) => setSelectedProject(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project..." />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(projects) && projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          {/* Project Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {selectedProjectName} - Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{totalProgress}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {Array.isArray(milestones) ? milestones.filter((m: any) => m.status === 'pending').length : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Array.isArray(milestones) ? milestones.filter((m: any) => m.status === 'in_progress').length : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Array.isArray(milestones) ? milestones.filter((m: any) => m.status === 'completed').length : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {Array.isArray(milestones) ? milestones.filter((m: any) => m.status === 'paid').length : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Paid</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones List */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </CardContent>
              </Card>
            ) : !Array.isArray(milestones) || milestones.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first progress billing milestone to get started with photo-backed invoicing.
                  </p>
                </CardContent>
              </Card>
            ) : (
              Array.isArray(milestones) && milestones.map((milestone: any) => {
                const StatusIcon = statusIcons[milestone.status as keyof typeof statusIcons];
                return (
                  <Card key={milestone.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <StatusIcon className="w-5 h-5" />
                            {milestone.title}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer hover:opacity-80 ${statusColors[milestone.status as keyof typeof statusColors]}`}>
                                  {milestone.status.replace('_', ' ')}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem 
                                  onClick={() => updateMilestoneStatusMutation.mutate({
                                    id: milestone.id, 
                                    status: 'pending'
                                  })}
                                  disabled={milestone.status === 'pending'}
                                >
                                  Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateMilestoneStatusMutation.mutate({
                                    id: milestone.id, 
                                    status: 'in_progress'
                                  })}
                                  disabled={milestone.status === 'in_progress'}
                                >
                                  In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateMilestoneStatusMutation.mutate({
                                    id: milestone.id, 
                                    status: 'completed'
                                  })}
                                  disabled={milestone.status === 'completed'}
                                >
                                  Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateMilestoneStatusMutation.mutate({
                                    id: milestone.id, 
                                    status: 'paid'
                                  })}
                                  disabled={milestone.status === 'paid'}
                                >
                                  Paid
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">${milestone.amount}</div>
                          <div className="text-sm text-muted-foreground">{milestone.percentage}% of project</div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList>
                          <TabsTrigger value="details">Details</TabsTrigger>
                          <TabsTrigger value="photos">Photos</TabsTrigger>
                          <TabsTrigger value="quickbooks">QuickBooks</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="details" className="space-y-4">
                          {milestone.photoInstructions && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Photo Requirements
                              </h4>
                              <p className="text-sm text-muted-foreground">{milestone.photoInstructions}</p>
                              <div className="text-xs text-muted-foreground mt-1">
                                Minimum photos required: {milestone.minPhotosRequired}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {milestone.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateMilestoneStatusMutation.mutate({
                                  id: milestone.id, 
                                  status: 'in_progress'
                                })}
                              >
                                Start Work
                              </Button>
                            )}
                            {milestone.status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateMilestoneStatusMutation.mutate({
                                  id: milestone.id, 
                                  status: 'completed'
                                })}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="photos">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold">Milestone Photos</h4>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(milestone.id, e.target.files)}
                                className="hidden"
                                id={`photo-upload-${milestone.id}`}
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => document.getElementById(`photo-upload-${milestone.id}`)?.click()}
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Upload Photos
                              </Button>
                            </div>
                            
                            {milestonePhotos[milestone.id]?.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {milestonePhotos[milestone.id].map((photo: any) => (
                                  <div key={photo.id} className="relative group">
                                    <img 
                                      src={`/api/files/${photo.fileName}`}
                                      alt="Milestone progress"
                                      className="w-full h-32 object-cover rounded-lg border"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => deletePhotoMutation.mutate(photo.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {new Date(photo.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Camera className="w-12 h-12 mx-auto mb-4" />
                                <p>No photos uploaded yet</p>
                                <p className="text-sm">Upload photos to document milestone progress</p>
                              </div>
                            )}
                            
                            {milestone.requiresPhotos && (
                              <div className="text-sm text-muted-foreground">
                                <span className={milestonePhotos[milestone.id]?.length >= milestone.minPhotosRequired ? "text-green-600" : "text-orange-600"}>
                                  {milestonePhotos[milestone.id]?.length || 0} of {milestone.minPhotosRequired} minimum photos uploaded
                                </span>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="quickbooks">
                          <div className="space-y-4">
                            {milestone.quickbooksInvoiceId ? (
                              <div className="p-4 bg-green-50 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <span className="font-semibold text-green-800">Synced to QuickBooks</span>
                                </div>
                                <div className="text-sm text-green-700">
                                  Invoice #{milestone.quickbooksInvoiceNumber} - {milestone.quickbooksInvoiceStatus}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <Button size="sm" disabled>
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Sync to QuickBooks
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Available for Pro plan users with QuickBooks connected
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}