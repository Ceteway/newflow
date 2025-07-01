import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Clock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Eye,
  Download,
  MoreHorizontal,
  Star,
  Activity,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Save
} from "lucide-react";
import { useWorkflow, WorkflowInstruction } from "@/contexts/WorkflowContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DarkWorkflowDashboard = () => {
  const { instructions, updateInstructionStage, updateInstruction } = useWorkflow();
  const { toast } = useToast();
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedInstructionId, setSelectedInstructionId] = useState<string>("");
  const [progressReason, setProgressReason] = useState("");

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case "document-drafting": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "execution": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "registration": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <Star className="w-4 h-4 text-red-400 fill-red-400" />;
      case "medium": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "low": return <Activity className="w-4 h-4 text-green-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getAvailableStages = (currentStage: WorkflowInstruction['stage']) => {
    const stages: WorkflowInstruction['stage'][] = ['document-drafting', 'execution', 'registration', 'completed'];
    const currentIndex = stages.indexOf(currentStage);
    return stages.slice(currentIndex + 1);
  };

  const handleStageUpdate = (instructionId: string, newStage: WorkflowInstruction['stage']) => {
    updateInstructionStage(instructionId, newStage);
    toast({
      title: "Stage Updated",
      description: `Instruction moved to ${newStage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    });
  };

  const handleAction = (action: string, instructionId: string) => {
    toast({
      title: "Action Triggered",
      description: `${action} for instruction ${instructionId}`,
    });
  };

  const handleAddReason = (instructionId: string) => {
    setSelectedInstructionId(instructionId);
    const instruction = instructions.find(i => i.id === instructionId);
    setProgressReason(instruction?.progressReason || "");
    setReasonDialogOpen(true);
  };

  const handleSaveReason = () => {
    if (selectedInstructionId) {
      updateInstruction(selectedInstructionId, { progressReason });
      toast({
        title: "Reason Added",
        description: "Progress reason has been updated",
      });
      setReasonDialogOpen(false);
      setProgressReason("");
      setSelectedInstructionId("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions Table */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-400" />
              <span>Active Instructions</span>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                {instructions.length}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                Export
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instructions.map((instruction) => (
              <div 
                key={instruction.id} 
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:bg-slate-700 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Priority & ID */}
                  <div className="col-span-3 flex items-center space-x-3">
                    {getPriorityIcon(instruction.priority)}
                    <div>
                      <p className="font-medium text-white">{instruction.id}</p>
                      <p className="text-xs text-slate-400">{instruction.siteName} - {instruction.siteCode}</p>
                    </div>
                  </div>

                  {/* Landlord */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3 text-slate-400" />
                      <p className="text-sm text-white truncate">{instruction.landlordName}</p>
                    </div>
                  </div>

                  {/* Status with Stage Controls */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(instruction.stage)}>
                        {instruction.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      {instruction.stage !== 'completed' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-white">
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-700 border-slate-600">
                            {getAvailableStages(instruction.stage).map((stage) => (
                              <DropdownMenuItem
                                key={stage}
                                onClick={() => handleStageUpdate(instruction.id, stage)}
                                className="text-slate-200 hover:bg-slate-600 cursor-pointer"
                              >
                                <ArrowRight className="w-3 h-3 mr-2" />
                                Move to {stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {instruction.stage === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white">{instruction.progress}%</span>
                      </div>
                      <Progress 
                        value={instruction.progress} 
                        className="h-2 bg-slate-600"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-end space-x-2">
                    {instruction.stage !== 'completed' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-white"
                        onClick={() => handleAddReason(instruction.id)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-white"
                      onClick={() => handleAction("View", instruction.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-white"
                      onClick={() => handleAction("Download ROF 6", instruction.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-3 pt-3 border-t border-slate-600 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Created {Math.floor((new Date().getTime() - new Date(instruction.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Next: {instruction.nextAction}</span>
                    </div>
                  </div>
                  <div>
                    Assigned to: <span className="text-white">{instruction.assignee}</span>
                  </div>
                </div>

                {/* Progress Reason */}
                {instruction.progressReason && (
                  <div className="mt-2 p-3 bg-slate-600/50 rounded border-l-4 border-yellow-500">
                    <p className="text-xs text-slate-300">
                      <span className="font-medium text-yellow-400">Reason for delay: </span>
                      {instruction.progressReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Reason Dialog */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Progress Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Why is this instruction still in progress?
            </p>
            <Input
              value={progressReason}
              onChange={(e) => setProgressReason(e.target.value)}
              placeholder="Enter reason for delay or current status..."
              className="bg-slate-700 border-slate-600 text-white"
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => setReasonDialogOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveReason}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DarkWorkflowDashboard;
