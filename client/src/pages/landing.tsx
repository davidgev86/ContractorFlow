import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardHat, Calendar, DollarSign, Users, CheckCircle, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <HardHat className="text-primary text-2xl mr-2" />
                <span className="font-bold text-xl text-slate-800">ContractorFlow</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-primary hover:bg-blue-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl sm:leading-tight">
              Project Management Built for
              <span className="block text-blue-200">Contractors</span>
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
              Stop juggling spreadsheets and sticky notes. ContractorFlow gives you job scheduling, 
              budget tracking, and client portals - all in one mobile-friendly platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-3"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                onClick={() => window.location.href = '/pricing'}
                className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-3 font-bold"
              >
                View Pricing
              </Button>
            </div>
            <p className="mt-4 text-blue-200 text-sm">
              14-day free trial • No credit card required • $199 setup fee applies after trial
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800">
              Everything You Need to Run Your Business
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              From job scheduling to client communication, ContractorFlow streamlines 
              every aspect of your contracting business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Job Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-slate-600">
                  Schedule jobs, assign tasks, and track progress. Never miss a deadline again.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Budget Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-slate-600">
                  Track materials, labor, and expenses. Know your profit margins in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Client Portals</CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-slate-600">
                  Give clients access to project updates, photos, and timelines. Build trust.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Mobile Ready</CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-slate-600">
                  Access your projects from any device. Perfect for contractors on the go.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-slate-600">
              No per-user fees. No hidden costs. Just straightforward pricing for contractors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Core Plan</CardTitle>
                <p className="text-slate-600">Perfect for small contractors</p>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-slate-800">$25</span>
                    <span className="text-slate-600 ml-1">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">+ $199 setup fee</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm">Job scheduling & task assignments</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm">Budget tracking (materials & labor)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm">Client portals</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm">Mobile-friendly dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm">Multiple users (no per-user fees)</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Pro Plan</CardTitle>
                <p className="text-slate-600">For growing contractors</p>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-slate-800">$35</span>
                    <span className="text-slate-600 ml-1">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">+ $199 setup fee</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm">Everything in Core Plan</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-semibold text-primary">QuickBooks integration (two-way sync)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm">Advanced reporting</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6 bg-primary hover:bg-blue-700"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h4 className="font-medium text-slate-800 mb-2">Concierge Onboarding</h4>
            <p className="text-sm text-slate-600 mb-4">
              Get up and running fast with guided setup, project import, and a live training session. 
              <strong className="text-slate-800"> $200 one-time fee</strong> (can be added anytime)
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              All plans include a 14-day free trial and 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Streamline Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join contractors who've already improved their project management with ContractorFlow.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-3"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <HardHat className="text-primary text-2xl mr-2" />
            <span className="font-bold text-xl">ContractorFlow</span>
          </div>
          <p className="text-center text-slate-400 mt-4">
            © 2024 ContractorFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
