
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Zap, Clock, TrendingUp } from "lucide-react";
import { AIService, AISuggestion } from "@/services/aiService";

interface AISuggestionsProps {
  formData: any;
  currentField?: string;
  onApplySuggestion: (field: string, value: string) => void;
}

const AISuggestions = ({ formData, currentField, onApplySuggestion }: AISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentField) {
      loadSuggestions();
    }
  }, [currentField, formData]);

  const loadSuggestions = async () => {
    if (!currentField) return;
    
    setIsLoading(true);
    try {
      const aiSuggestions = await AIService.getFormSuggestions(formData, currentField);
      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  if (!suggestions.length || !currentField) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>AI Suggestions</span>
          <Badge variant="outline" className="text-xs">
            <Lightbulb className="w-3 h-3 mr-1" />
            Smart
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900">{suggestion.value}</span>
                <Badge className={getConfidenceColor(suggestion.confidence)}>
                  {Math.round(suggestion.confidence * 100)}% confident
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{suggestion.reason}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApplySuggestion(suggestion.field || currentField, suggestion.value)}
              className="ml-3 hover:bg-blue-50"
            >
              Apply
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AISuggestions;
