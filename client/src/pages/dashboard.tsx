import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navigation } from "@/components/navigation";
import { TrialBanner } from "@/components/trial-banner";
import { ProjectCard } from "@/components/project-card";
import { TaskItem } from "@/components/task-item";
import { ProtectedRoute } from "@/components/protected-route";
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  Home,
  Hammer,
  Wrench,
  Target
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const recentProjects = projects?.slice(0, 3) || [];
  const todaysTasks = tasks?.filter((task: any) => {
    const today = new Date();
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === today.toDateString();
  }).slice(0, 4) || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <TrialBanner />
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate">
                  Welcome back, {user?.firstName || 'Contractor'}
                </h1>
                <p className="mt-1 text-blue-100">Here's what's happening with your projects today</p>
              </div>
              <div className="mt-4 md:mt-0 md:ml-4">
                <Button className="bg-white text-primary hover:bg-gray-50 font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center">
                  <TrendingUp className="text-white/80 text-xl mr-3" />
                  <div>
                    <p className="text-blue-100 text-sm">Active Projects</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? "..." : stats?.activeProjects || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="text-white/80 text-xl mr-3" />
                  <div>
                    <p className="text-blue-100 text-sm">Due This Week</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? "..." : stats?.dueThisWeek || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center">
                  <DollarSign className="text-white/80 text-xl mr-3" />
                  <div>
                    <p className="text-blue-100 text-sm">Revenue MTD</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? "..." : stats?.revenueMTD || "$0"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="text-white/80 text-xl mr-3" />
                  <div>
                    <p className="text-blue-100 text-sm">Active Clients</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? "..." : stats?.activeClients || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Recent Projects & Tasks */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Recent Projects */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {projectsLoading ? (
                    <div className="p-6 text-center text-slate-500">Loading projects...</div>
                  ) : recentProjects.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      No projects yet. <Button variant="link" className="p-0 h-auto">Create your first project</Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {recentProjects.map((project: any) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Today's Tasks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Today's Tasks</CardTitle>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <div className="text-center text-slate-500">Loading tasks...</div>
                  ) : todaysTasks.length === 0 ? (
                    <div className="text-center text-slate-500">
                      No tasks due today. <Button variant="link" className="p-0 h-auto">Schedule a task</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todaysTasks.map((task: any) => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Quick Actions & Widgets */}
            <div className="space-y-6">
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Plus className="w-6 h-6" />
                      <span className="text-sm font-medium">New Project</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Users className="w-6 h-6" />
                      <span className="text-sm font-medium">Add Client</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <DollarSign className="w-6 h-6" />
                      <span className="text-sm font-medium">Create Invoice</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Calendar className="w-6 h-6" />
                      <span className="text-sm font-medium">Schedule Task</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Budget Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Budget Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Monthly Target</span>
                        <span className="text-sm font-bold text-slate-800">
                          {statsLoading ? "..." : stats?.monthlyTarget || "$0"}
                        </span>
                      </div>
                      <Progress value={54} className="h-3" />
                      <p className="text-xs text-slate-500 mt-1">
                        {statsLoading ? "Loading..." : `${stats?.revenueMTD || "$0"} completed (54%)`}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {statsLoading ? "..." : stats?.profit || "$0"}
                        </p>
                        <p className="text-xs text-slate-500">Profit MTD</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">
                          {statsLoading ? "..." : stats?.expenses || "$0"}
                        </p>
                        <p className="text-xs text-slate-500">Expenses MTD</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">Task completed: Install kitchen cabinets</p>
                        <p className="text-xs text-slate-500">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">Payment received: $2,500</p>
                        <p className="text-xs text-slate-500">4 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">New client added: Davis Home</p>
                        <p className="text-xs text-slate-500">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
