
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Users,
  MapPin,
  Settings
} from "lucide-react";
import { useWorkflow } from "@/contexts/WorkflowContext";

const StatsGrid = () => {
  const { instructions } = useWorkflow();

  // Calculate stage-based statistics
  const stageStats = {
    total: instructions.length,
    documentDrafting: instructions.filter(i => i.stage === 'document-drafting').length,
    execution: instructions.filter(i => i.stage === 'execution').length,
    registration: instructions.filter(i => i.stage === 'registration').length,
    completed: instructions.filter(i => i.stage === 'completed').length,
    inProgress: instructions.filter(i => i.stage !== 'completed').length,
    avgProgress: Math.round(instructions.reduce((sum, i) => sum + i.progress, 0) / instructions.length)
  };

  const stats = [
    {
      title: "Total Instructions",
      value: stageStats.total,
      change: "+12%",
      icon: FileText,
      color: "text-cyan-300",
      bgColor: "bg-gradient-to-br from-cyan-500/30 to-blue-500/30",
      borderColor: "border-cyan-400/50"
    },
    {
      title: "In Progress",
      value: stageStats.inProgress,
      change: "+5%",
      icon: Clock,
      color: "text-amber-300",
      bgColor: "bg-gradient-to-br from-amber-500/30 to-orange-500/30",
      borderColor: "border-amber-400/50"
    },
    {
      title: "Completed",
      value: stageStats.completed,
      change: "+8%",
      icon: CheckCircle2,
      color: "text-emerald-300",
      bgColor: "bg-gradient-to-br from-emerald-500/30 to-green-500/30",
      borderColor: "border-emerald-400/50"
    },
    {
      title: "Avg Progress",
      value: `${stageStats.avgProgress}%`,
      change: "+3%",
      icon: TrendingUp,
      color: "text-violet-300",
      bgColor: "bg-gradient-to-br from-violet-500/30 to-purple-500/30",
      borderColor: "border-violet-400/50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-slate-700/80 border-slate-600 text-white hover:bg-slate-600/80 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                {stat.title}
              </CardTitle>
              <div className={`p-3 rounded-lg ${stat.bgColor} border ${stat.borderColor} shadow-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-400/50 px-3 py-1">
                  {stat.change}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                vs last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stage Breakdown */}
      <Card className="bg-slate-700/80 border-slate-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            <span className="text-xl">Workflow Stage Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300">
              <div className="text-3xl font-bold text-cyan-300 mb-2">{stageStats.documentDrafting}</div>
              <p className="text-sm text-slate-200 font-medium">Document Drafting</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/30 hover:from-amber-500/30 hover:to-yellow-500/30 transition-all duration-300">
              <div className="text-3xl font-bold text-amber-300 mb-2">{stageStats.execution}</div>
              <p className="text-sm text-slate-200 font-medium">Execution</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-400/30 hover:from-emerald-500/30 hover:to-green-500/30 transition-all duration-300">
              <div className="text-3xl font-bold text-emerald-300 mb-2">{stageStats.registration}</div>
              <p className="text-sm text-slate-200 font-medium">Registration</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-500/20 border border-slate-400/30 hover:from-slate-500/30 hover:to-gray-500/30 transition-all duration-300">
              <div className="text-3xl font-bold text-slate-300 mb-2">{stageStats.completed}</div>
              <p className="text-sm text-slate-200 font-medium">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsGrid;
