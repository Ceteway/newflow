import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useToast } from '@/hooks/use-toast';
import { PDFReportService } from '@/services/pdfReportService';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

const Reports = () => {
  const { instructions } = useWorkflow();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [dateRange, setDateRange] = useState('last-30-days');
  const [reportType, setReportType] = useState('workflow-summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExportPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      toast({
        title: "Generating Report",
        description: "Please wait while we generate your PDF report...",
      });

      // Prepare report data
      const reportData = {
        instructions: instructions || [],
        dateRange: dateRange === 'custom' ? `${startDate} to ${endDate}` : dateRange,
        reportType,
        generatedAt: new Date().toLocaleDateString()
      };

      await PDFReportService.generateWorkflowReport(reportData);
      
      toast({
        title: "Report Generated",
        description: "Your PDF report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Calculate statistics
  const totalInstructions = instructions.length;
  const completedInstructions = instructions.filter(i => i.stage === 'completed').length;
  const inProgressInstructions = instructions.filter(i => i.stage !== 'completed').length;
  const highPriorityInstructions = instructions.filter(i => i.priority === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-gray-600">Generate comprehensive reports for workflow analysis</p>
        </div>
        <Button 
          onClick={handleExportPDF}
          disabled={isGeneratingPDF}
          className="bg-red-600 hover:bg-red-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInstructions}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedInstructions}</div>
            <p className="text-xs text-gray-500 mt-1">
              {totalInstructions > 0 ? Math.round((completedInstructions / totalInstructions) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressInstructions}</div>
            <p className="text-xs text-gray-500 mt-1">Active workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPriorityInstructions}</div>
            <p className="text-xs text-gray-500 mt-1">Urgent attention needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Report Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workflow-summary">Workflow Summary</SelectItem>
                  <SelectItem value="detailed-analysis">Detailed Analysis</SelectItem>
                  <SelectItem value="performance-metrics">Performance Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="this-year">This year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Export Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Generate a comprehensive PDF report containing workflow statistics, progress analysis, 
              and detailed instruction information based on your selected criteria.
            </p>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleExportPDF}
                disabled={isGeneratingPDF}
                className="bg-red-600 hover:bg-red-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Generating PDF...' : 'Generate PDF Report'}
              </Button>
              
              {isGeneratingPDF && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  <span className="text-sm">Processing report...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;