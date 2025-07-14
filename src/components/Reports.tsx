import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useToast } from '@/hooks/use-toast';
import { PDFReportService } from '@/services/pdfReportService';
import { FileText, Download } from 'lucide-react';

export const Reports: React.FC = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { workflows } = useWorkflow();
  const { toast } = useToast();

  const handleExportPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Prepare report data from workflows
      const reportData = {
        workflows: workflows || [],
        generatedAt: new Date().toISOString(),
        totalWorkflows: workflows?.length || 0
      };

      await PDFReportService.generateWorkflowReport(reportData);
      
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export workflow reports
          </p>
        </div>
        <Button 
          onClick={handleExportPDF}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Workflow Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{workflows?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Workflows</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {workflows?.filter(w => w.status === 'completed').length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {workflows?.filter(w => w.status === 'pending').length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Generate a comprehensive PDF report of all workflow data and statistics.
            </p>
            <Button 
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Generate PDF Report'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};