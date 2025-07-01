
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MapPin, 
  Settings, 
  Users, 
  Search,
  Filter,
  Menu,
  X,
  Home,
  Calendar,
  Clock,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "rof5", label: "New Instruction", icon: FileText },
  { id: "templates", label: "Templates", icon: Calendar },
  { id: "reminders", label: "Reminders", icon: Clock },
  { id: "reports", label: "Reports", icon: TrendingUp },
];

const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold">Fanisi Flow</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700",
                  activeTab === item.id && "bg-orange-500/20 text-orange-400 border-r-2 border-orange-500",
                  !sidebarOpen && "justify-center"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <item.icon className={cn("w-4 h-4", sidebarOpen && "mr-3")} />
                {sidebarOpen && item.label}
              </Button>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700">
          <div className={cn("flex items-center", !sidebarOpen && "justify-center")}>
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Property Workflow Management</h1>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                AI Enhanced
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-700 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search instructions..."
                  className="bg-transparent border-0 outline-0 text-sm placeholder:text-slate-400 w-64"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
