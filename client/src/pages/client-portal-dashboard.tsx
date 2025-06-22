import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  User
} from "lucide-react";

export default function ClientPortalDashboard() {
  const { toast } = useToast();
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
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
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
                            {update.photos.map((photo: any) => (
                              <div key={photo.id} className="relative group">
                                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                  <img
                                    src={`/api/client-portal/photos/${photo.fileName}`}
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