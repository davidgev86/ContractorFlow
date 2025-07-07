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
import jsPDF from "jspdf";

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

  const { data: projectUpdates } = useQuery({
    queryKey: ["/api/project-updates"],
  });

  // Calculate additional metrics
  const completedProjects = Array.isArray(projects) ? projects.filter((p: any) => p.status === "completed").length : 0;
  const inProgressProjects = Array.isArray(projects) ? projects.filter((p: any) => p.status === "in_progress").length : 0;
  const pendingTasks = Array.isArray(tasks) ? tasks.filter((t: any) => t.status === "pending").length : 0;
  const completedTasks = Array.isArray(tasks) ? tasks.filter((t: any) => t.status === "completed").length : 0;

  const generateBusinessReport = () => {
    const reportData = {
      totalRevenue: (stats as any)?.revenueMTD || "$0",
      activeProjects: (stats as any)?.activeProjects || 0,
      totalClients: Array.isArray(clients) ? clients.length : 0,
      completionRate: Array.isArray(tasks) && tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
      projectBreakdown: {
        planning: Array.isArray(projects) ? projects.filter((p: any) => p.status === "planning").length : 0,
        inProgress: inProgressProjects,
        completed: completedProjects,
        onHold: Array.isArray(projects) ? projects.filter((p: any) => p.status === "on_hold").length : 0
      },
      expenses: (stats as any)?.expenses || "$0",
      profit: (stats as any)?.profit || "$0"
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

    const project = Array.isArray(projects) ? projects.find((p: any) => p.id === parseInt(selectedProjectId)) : null;
    
    if (!project) {
      toast({
        title: "Project Not Found",
        description: "Selected project not found",
        variant: "destructive",
      });
      return;
    }

    const client = Array.isArray(clients) ? clients.find((c: any) => c.id === project.clientId) : null;

    const projectTasks = Array.isArray(tasks) ? tasks.filter((t: any) => t.projectId === project.id) : [];
    const projectPhotoUpdates = Array.isArray(projectUpdates) ? projectUpdates.filter((u: any) => u.projectId === project.id && u.imageUrl) : [];

    const clientReportData = {
      projectName: project.name,
      clientName: client?.name || "N/A",
      siteAddress: project.siteAddress || "N/A",
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A",
      endDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A",
      dueDate: project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "N/A",
      progress: project.progress || 0,
      description: project.description || "No description provided",
      budget: project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : "N/A",
      tasks: projectTasks,
      photos: projectPhotoUpdates
    };

    // Generate professional PDF report
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Enhanced header with comprehensive branding
    pdf.setFillColor(59, 130, 246); // Primary blue color
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Company name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("FieldContractorFlow", 20, 22);
    
    // Tagline
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Professional Project Management Solutions", 20, 30);
    
    // Contact information on separate lines for better readability
    pdf.setFontSize(8);
    pdf.text("Email: support@contractorflow.com", 20, 37);
    pdf.text("Phone: (555) 123-4567", 20, 43);
    
    // Report type aligned to right
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROJECT EXECUTIVE REPORT", pageWidth - 20, 25, { align: 'right' });
    
    // Website aligned to right
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("www.contractorflow.com", pageWidth - 20, 40, { align: 'right' });
    
    // Reset text color for content
    pdf.setTextColor(0, 0, 0);
    
    // Report title and date with enhanced spacing
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${clientReportData.projectName} - Project Report`, 20, 65);
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 75);
    pdf.text(`Report ID: CR-${Date.now().toString().slice(-6)}`, 20, 82);
    
    // Company information box
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(1);
    pdf.rect(20, 90, pageWidth - 40, 22);
    
    pdf.setFontSize(9);
    pdf.setTextColor(59, 130, 246);
    pdf.setFont("helvetica", "bold");
    pdf.text("About FieldContractorFlow:", 25, 100);
    
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont("helvetica", "normal");
    pdf.text("Leading provider of project management solutions for contractors and construction professionals.", 25, 106);
    pdf.text("Trusted by thousands of contractors nationwide for streamlined project delivery.", 25, 110);
    
    // Client Information Section
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("CLIENT INFORMATION", 20, 125);
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Client Name: ${clientReportData.clientName}`, 20, 140);
    pdf.text(`Site Address: ${clientReportData.siteAddress}`, 20, 150);
    pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 160);
    
    // Project Overview Section
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROJECT OVERVIEW", 20, 180);
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    
    let yPos = 195;
    const lineHeight = 10;
    
    pdf.text(`Project Name: ${clientReportData.projectName}`, 20, yPos);
    yPos += lineHeight;
    
    // Status with colored indication
    pdf.text("Status: ", 20, yPos);
    const statusText = clientReportData.status.replace('_', ' ').toUpperCase();
    const statusColor = clientReportData.status === 'completed' ? [34, 197, 94] as [number, number, number] : 
                       clientReportData.status === 'in_progress' ? [59, 130, 246] as [number, number, number] : 
                       clientReportData.status === 'planning' ? [168, 85, 247] as [number, number, number] : [107, 114, 128] as [number, number, number];
    
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.setFont("helvetica", "bold");
    pdf.text(statusText, 45, yPos);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    yPos += lineHeight;
    
    pdf.text(`Start Date: ${clientReportData.startDate}`, 20, yPos);
    yPos += lineHeight;
    pdf.text(`Due Date: ${clientReportData.dueDate}`, 20, yPos);
    yPos += lineHeight;
    pdf.text(`Budget: ${clientReportData.budget}`, 20, yPos);
    yPos += lineHeight * 2;
    
    // Progress Section with visual progress bar
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROJECT PROGRESS", 20, yPos);
    yPos += 15;
    
    // Progress bar
    const barWidth = 150;
    const barHeight = 10;
    pdf.setFillColor(229, 231, 235); // Gray background
    pdf.rect(20, yPos, barWidth, barHeight, 'F');
    
    const progressWidth = (clientReportData.progress / 100) * barWidth;
    pdf.setFillColor(34, 197, 94); // Green progress
    pdf.rect(20, yPos, progressWidth, barHeight, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${clientReportData.progress}% Complete`, 20, yPos + 25);
    
    yPos += 40;
    
    // Check if we need a new page before adding description
    if (yPos > pageHeight - 100) {
      pdf.addPage();
      yPos = 20;
    }
    
    // Project Description
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROJECT DESCRIPTION", 20, yPos);
    yPos += 15;
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    const splitDescription = pdf.splitTextToSize(clientReportData.description, pageWidth - 40);
    pdf.text(splitDescription, 20, yPos);
    yPos += splitDescription.length * 5 + 20;
    
    // Task Summary (if tasks exist)
    if (clientReportData.tasks.length > 0) {
      // Check if we need a new page
      if (yPos > pageHeight - 120) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("TASK SUMMARY", 20, yPos);
      yPos += 15;
      
      const completedTasks = clientReportData.tasks.filter((t: any) => t.status === 'completed').length;
      const totalTasks = clientReportData.tasks.length;
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Total Tasks: ${totalTasks}`, 20, yPos);
      yPos += lineHeight;
      pdf.text(`Completed Tasks: ${completedTasks}`, 20, yPos);
      yPos += lineHeight;
      pdf.text(`Task Completion Rate: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`, 20, yPos);
      yPos += lineHeight * 2;
      
      // Recent tasks list (limit to 5)
      const recentTasks = clientReportData.tasks.slice(0, 5);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Recent Tasks:", 20, yPos);
      yPos += 10;
      
      recentTasks.forEach((task: any) => {
        if (yPos > pageHeight - 80) { // Increased margin to prevent footer overlap
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const taskStatus = task.status.replace('_', ' ').toUpperCase();
        pdf.text(`• ${task.title} - ${taskStatus}`, 25, yPos);
        yPos += 8;
      });
    }
    
    // Project Photos Section
    if (clientReportData.photos.length > 0) {
      // Check if we need a new page for photos
      if (yPos > pageHeight - 120) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("PROJECT PHOTOS", 20, yPos);
      yPos += 15;
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${clientReportData.photos.length} photo(s) available in project updates.`, 20, yPos);
      yPos += 10;
      
      // Note about photos (since we can't easily embed them in PDF)
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Photos are available in your project dashboard and client portal.", 20, yPos);
      yPos += 8;
      
      // List photo updates with dates
      const photoList = clientReportData.photos.slice(0, 3); // Show first 3 photos
      photoList.forEach((update: any, index: number) => {
        if (yPos > pageHeight - 80) {
          pdf.addPage();
          yPos = 20;
        }
        
        const updateDate = update.createdAt ? new Date(update.createdAt).toLocaleDateString() : "N/A";
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`${index + 1}. Photo update from ${updateDate}`, 25, yPos);
        if (update.content) {
          yPos += 6;
          const splitContent = pdf.splitTextToSize(update.content, pageWidth - 50);
          pdf.text(splitContent.slice(0, 2), 30, yPos); // Show first 2 lines only
          yPos += Math.min(splitContent.length, 2) * 4;
        }
        yPos += 8;
      });
      
      if (clientReportData.photos.length > 3) {
        pdf.text(`... and ${clientReportData.photos.length - 3} more photos in your project dashboard.`, 25, yPos);
        yPos += 8;
      }
    }
    
    // Compact professional footer - positioned to avoid cutoff
    const footerY = pageHeight - 25;
    
    // Footer separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(20, footerY - 3, pageWidth - 20, footerY - 3);
    
    // Company branding in footer - more compact
    pdf.setFontSize(8);
    pdf.setTextColor(59, 130, 246); // Brand blue
    pdf.setFont("helvetica", "bold");
    pdf.text("FieldContractorFlow - Professional Project Management Solutions", 20, footerY + 3);
    
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont("helvetica", "normal");
    pdf.text("Confidential Report | Generated: " + new Date().toLocaleDateString(), 20, footerY + 10);
    
    // Page number aligned to right
    pdf.text(`Page 1 of ${pdf.getNumberOfPages()}`, pageWidth - 20, footerY + 10, { align: 'right' });
    
    // Save the PDF
    const fileName = `${clientReportData.projectName.replace(/\s+/g, '-').toLowerCase()}-executive-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    setIsClientReportDialogOpen(false);
    setSelectedProjectId("");
    
    toast({
      title: "Executive Report Generated",
      description: "Professional PDF report has been downloaded successfully",
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
                          {Array.isArray(projects) && projects.map((project: any) => {
                            const client = Array.isArray(clients) ? clients.find((c: any) => c.id === project.clientId) : null;
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
