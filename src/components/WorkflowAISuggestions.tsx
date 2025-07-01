
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { AIService, WorkflowSuggestion } from "@/services/aiService";
import { useWorkflow, WorkflowInstruction } from "@/contexts/WorkflowContext";
import { useToast } from "@/hooks/use-toast";

interface WorkflowAISuggestionsProps {
  instruction: WorkflowInstruction;
}

const WorkflowAISuggestions = ({ instruction }: WorkflowAISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const { updateInstruction, addAuditEntry } = useWorkflow();
  const { toast } = useToast();

  useEffect(() => {
    const aiSuggestions = AIService.getWorkflowSuggestions(instruction);
    setSuggestions(aiSuggestions);
  }, [instruction]);

  const handleApplySuggestion = (suggestion: WorkflowSuggestion) => {
    // Update the instruction's next action
    updateInstruction(instruction.id, {
      nextAction: suggestion.action,
      priority: suggestion.priority
    });

    // Add audit entry
    addAuditEntry(instruction.id, {
      action: 'AI Suggestion Applied',
      user: 'AI Assistant',
      timestamp: new Date().toISOString(),
      details: `Applied suggestion: ${suggestion.action}`
    });

    toast({
      title: "AI Suggestion Applied",
      description: suggestion.action,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return "bg-red-100 text-red-800";
      case 'medium': return "bg-yellow-100 text-yellow-800";
      case 'low': return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!suggestions.length) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Brain className="w-4 h-4 text-purple-600" />
          <span>AI Workflow Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="p-3 bg-white rounded-lg border">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">{suggestion.action}</span>
                  <Badge className={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{suggestion.reason}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{suggestion.estimatedDays} days</span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApplySuggestion(suggestion)}
                className="ml-3 hover:bg-purple-50"
              >
                Apply
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WorkflowAISuggestions;
