import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Clock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Download,
  Brain
} from "lucide-react";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { DocumentGenerator } from "@/services/documentGenerator";
import { useToast } from "@/hooks/use-toast";
import WorkflowAISuggestions from "@/components/WorkflowAISuggestions";

const WorkflowDashboard = () => {
  const { instructions, updateInstruction, addAuditEntry } = useWorkflow();
  const { toast } = useToast();

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case "document-drafting": return "bg-blue-100 text-blue-800";
      case "execution": return "bg-yellow-100 text-yellow-800";
      case "registration": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const handleGenerateDocument = async (instructionId: string, templateId: string) => {
    const instruction = instructions.find(i => i.id === instructionId);
    if (!instruction) return;

    try {
      const variables = [
        { key: 'current_date', value: new Date().toLocaleDateString() },
        { key: 'site_code', value: instruction.formData?.siteCode || instruction.siteCode },
        { key: 'site_location', value: instruction.formData?.siteLocation || instruction.siteLocation },
        { key: 'landlord_name', value: instruction.formData?.landlordName || instruction.landlordName },
        { key: 'file_ref', value: `${instruction.siteCode}/2024` }
      ];

      const content = DocumentGenerator.populateTemplate(templateId, variables);
      DocumentGenerator.downloadDocument(content, `${instruction.siteCode}-${templateId}.txt`);

      addAuditEntry(instructionId, {
        action: 'Document Generated',
        user: 'Current User',
        timestamp: new Date().toISOString(),
        details: `Generated ${templateId} document`
      });

      toast({
        title: "Document Generated",
        description: `${templateId} has been generated and downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate document.",
        variant: "destructive"
      });
    }
  };

  const stageCounts = {
    "ROF 5 Received": instructions.filter(i => i.progress < 25).length,
    "Document Drafting": instructions.filter(i => i.stage === 'document-drafting').length,
    "Under Execution": instructions.filter(i => i.stage === 'execution').length,
    "Registration & Closure": instructions.filter(i => i.stage === 'registration').length
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Active Property Instructions</span>
            <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
              <Brain className="w-3 h-3 mr-1" />
              AI Enhanced
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {instructions.map((instruction) => (
              <div key={instruction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{instruction.id}</h3>
                          <Badge className={getStatusColor(instruction.stage)}>
                            {instruction.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <AlertTriangle className={`w-4 h-4 ${getPriorityColor(instruction.priority)}`} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{instruction.siteLocation}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{instruction.landlordName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{Math.floor((new Date().getTime() - new Date(instruction.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days active</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Next: {instruction.nextAction}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGenerateDocument(instruction.id, 'rof6-template')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          ROF 6
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{instruction.progress}%</span>
                      </div>
                      <Progress value={instruction.progress} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Assigned to: {instruction.assignee}</span>
                        <span>Site: {instruction.siteCode}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <WorkflowAISuggestions instruction={instruction} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Stages Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Stages Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stageCounts).map(([stage, count], index) => (
              <div key={index} className="text-center p-4 rounded-lg border">
                <div className={`w-12 h-12 ${['bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-green-500'][index]} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">{count}</h3>
                <p className="text-sm text-gray-600">{stage}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowDashboard;
