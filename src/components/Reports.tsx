
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  Users,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useWorkflow } from "@/contexts/WorkflowContext";

const Reports = () => {
  const { instructions } = useWorkflow();
  const [dateRange, setDateRange] = useState("last-30-days");
  const [reportType, setReportType] = useState("overview");

  // Generate sample data based on instructions
  const stageData = [
    { name: 'Document Drafting', value: instructions.filter(i => i.stage === 'document-drafting').length, color: '#3B82F6' },
    { name: 'Execution', value: instructions.filter(i => i.stage === 'execution').length, color: '#F59E0B' },
    { name: 'Registration', value: instructions.filter(i => i.stage === 'registration').length, color: '#10B981' },
    { name: 'Completed', value: instructions.filter(i => i.stage === 'completed').length, color: '#6B7280' }
  ];

  const monthlyData = [
    { month: 'Jan', completed: 8, created: 12, pending: 4 },
    { month: 'Feb', completed: 12, created: 15, pending: 3 },
    { month: 'Mar', completed: 15, created: 18, pending: 3 },
    { month: 'Apr', completed: 10, created: 14, pending: 4 },
    { month: 'May', completed: 18, created: 20, pending: 2 },
    { month: 'Jun', completed: 22, created: 25, pending: 3 }
  ];

  const performanceData = [
    { category: 'Average Processing Time', value: '12 days', trend: '-2 days' },
    { category: 'Success Rate', value: '94%', trend: '+3%' },
    { category: 'Documents Generated', value: '156', trend: '+45' },
    { category: 'Overdue Rate', value: '8%', trend: '-2%' }
  ];

  const handleExport = (format: string) => {
    const data = JSON.stringify(instructions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fanisi-report-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Reports & Analytics</span>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('json')}
                className="hover:scale-105 transition-transform duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceData.map((metric, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.category}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                      {metric.trend}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-slide-in-right">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Instructions by Stage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-slide-in-right animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Monthly Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
                <Bar dataKey="created" fill="#3B82F6" name="Created" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-fade-in animation-delay-400">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Completion Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Completed Instructions"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="New Instructions"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Report Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-fade-in animation-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Instruction Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-700">ID</th>
                  <th className="text-left p-3 font-medium text-gray-700">Location</th>
                  <th className="text-left p-3 font-medium text-gray-700">Stage</th>
                  <th className="text-left p-3 font-medium text-gray-700">Progress</th>
                  <th className="text-left p-3 font-medium text-gray-700">Days Active</th>
                  <th className="text-left p-3 font-medium text-gray-700">Priority</th>
                </tr>
              </thead>
              <tbody>
                {instructions.map((instruction, index) => (
                  <tr key={instruction.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium">{instruction.id}</td>
                    <td className="p-3">{instruction.siteLocation}</td>
                    <td className="p-3">
                      <Badge className={
                        instruction.stage === 'completed' ? 'bg-green-100 text-green-800' :
                        instruction.stage === 'execution' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {instruction.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${instruction.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{instruction.progress}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {Math.floor((new Date().getTime() - new Date(instruction.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                    </td>
                    <td className="p-3">
                      <div className={`flex items-center space-x-1`}>
                        <AlertCircle className={`w-4 h-4 ${
                          instruction.priority === 'high' ? 'text-red-500' :
                          instruction.priority === 'medium' ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        <span className="capitalize text-sm">{instruction.priority}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
