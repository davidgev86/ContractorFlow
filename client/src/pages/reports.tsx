import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { TrialBanner } from "@/components/trial-banner";
import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users,
  BarChart3,
  PieChart,
  Activity,
  Download,
  FileText,
  Share
} from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isClientReportDialogOpen, setIsClientReportDialogOpen] = useState(false);
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Calculate additional metrics
  const completedProjects = projects?.filter((p: any) => p.status === "completed").length || 0;
  const inProgressProjects = projects?.filter((p: any) => p.status === "in_progress").length || 0;
  const pendingTasks = tasks?.filter((t: any) => t.status === "pending").length || 0;
  const completedTasks = tasks?.filter((t: any) => t.status === "completed").length || 0;

  const generateBusinessReport = () => {
    const reportData = {
      totalRevenue: stats?.revenueMTD || "$0",
      activeProjects: stats?.activeProjects || 0,
      totalClients: clients?.length || 0,
      completionRate: tasks?.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
      projectBreakdown: {
        planning: projects?.filter((p: any) => p.status === "planning").length || 0,
        inProgress: inProgressProjects,
        completed: completedProjects,
        onHold: projects?.filter((p: any) => p.status === "on_hold").length || 0
      },
      expenses: stats?.expenses || "$0",
      profit: stats?.profit || "$0"
    };

    // Generate CSV format
    const csvContent = `Business Report - ${new Date().toLocaleDateString()}\n\n` +
      `Total Revenue,${reportData.totalRevenue}\n` +
      `Active Projects,${reportData.activeProjects}\n` +
      `Total Clients,${reportData.totalClients}\n` +
      `Task Completion Rate,${reportData.completionRate}%\n` +
      `Total Expenses,${reportData.expenses}\n` +
      `Net Profit,${reportData.profit}\n\n` +
      `Project Status Breakdown:\n` +
      `Planning,${reportData.projectBreakdown.planning}\n` +
      `In Progress,${reportData.projectBreakdown.inProgress}\n` +
      `Completed,${reportData.projectBreakdown.completed}\n` +
      `On Hold,${reportData.projectBreakdown.onHold}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report Generated",
      description: "Business report has been downloaded successfully",
    });
  };

  const generateClientReport = () => {
    if (!selectedProjectId) {
      toast({
        title: "No Project Selected",
        description: "Please select a project to generate client report",
        variant: "destructive",
      });
      return;
    }

    const project = projects?.find((p: any) => p.id === parseInt(selectedProjectId));
    
    if (!project) {
      toast({
        title: "Project Not Found",
        description: "Selected project not found",
        variant: "destructive",
      });
      return;
    }

    const client = clients?.find((c: any) => c.id === project.clientId);

    const clientReportData = {
      projectName: project.name,
      clientName: client?.name || "N/A",
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A",
      endDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A",
      progress: project.progress || 0,
      description: project.description || "No description provided"
    };

    // Generate client-friendly CSV
    const csvContent = `Project Report - ${clientReportData.projectName}\n` +
      `Generated on: ${new Date().toLocaleDateString()}\n\n` +
      `Client Name,${clientReportData.clientName}\n` +
      `Project Name,${clientReportData.projectName}\n` +
      `Status,${clientReportData.status.replace('_', ' ').toUpperCase()}\n` +
      `Start Date,${clientReportData.startDate}\n` +
      `Target Completion,${clientReportData.endDate}\n` +
      `Progress,${clientReportData.progress}%\n` +
      `Description,${clientReportData.description}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-report-${project.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setIsClientReportDialogOpen(false);
    setSelectedProjectId("");
    
    toast({
      title: "Client Report Generated",
      description: `Report for ${project.name} has been downloaded`,
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <TrialBanner />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
              <p className="text-slate-600 mt-1">Track your business performance and project metrics</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <Button onClick={generateBusinessReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Business Report
              </Button>
              <Dialog open={isClientReportDialogOpen} onOpenChange={setIsClientReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share className="w-4 h-4" />
                    Generate Client Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Generate Client Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Project</label>
                      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects?.map((project: any) => {
                            const client = clients?.find((c: any) => c.id === project.clientId);
                            return (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name} {client ? `(${client.name})` : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsClientReportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={generateClientReport} disabled={!selectedProjectId}>
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.revenueMTD || "$0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Month to date
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.activeProjects || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently in progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time clients
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks?.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Task completion rate
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Project Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Planning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {projects?.filter((p: any) => p.status === "planning").length || 0}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {projects?.length ? Math.round((projects.filter((p: any) => p.status === "planning").length / projects.length) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{inProgressProjects}</span>
                      <Badge variant="outline" className="text-xs">
                        {projects?.length ? Math.round((inProgressProjects / projects.length) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{completedProjects}</span>
                      <Badge variant="outline" className="text-xs">
                        {projects?.length ? Math.round((completedProjects / projects.length) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">On Hold</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {projects?.filter((p: any) => p.status === "on_hold").length || 0}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {projects?.length ? Math.round((projects.filter((p: any) => p.status === "on_hold").length / projects.length) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Task Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Task Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Tasks</span>
                    <span className="text-2xl font-bold">{tasks?.length || 0}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Pending</span>
                      </div>
                      <span className="text-sm font-medium">{pendingTasks}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">In Progress</span>
                      </div>
                      <span className="text-sm font-medium">
                        {tasks?.filter((t: any) => t.status === "in_progress").length || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Completed</span>
                      </div>
                      <span className="text-sm font-medium">{completedTasks}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Completion Rate</span>
                      <Badge className="bg-green-100 text-green-800">
                        {tasks?.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Projects Table */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {!projects || projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No projects to display
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Project</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Budget</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Progress</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.slice(0, 5).map((project: any) => (
                        <tr key={project.id} className="border-b border-slate-100">
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{project.name}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="outline"
                              className={
                                project.status === "completed" ? "bg-green-100 text-green-800" :
                                project.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                                project.status === "planning" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }
                            >
                              {project.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${project.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-slate-600">{project.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
