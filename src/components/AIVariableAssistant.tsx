
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AIDocumentProcessor, VariableSuggestion, DocumentAnalysis } from "@/services/aiDocumentProcessor";
import { 
  Bot, 
  Wand2, 
  CheckCircle, 
  AlertCircle,
  Edit3,
  Plus
} from "lucide-react";

interface AIVariableAssistantProps {
  content: string;
  onContentUpdate: (content: string, variables: string[]) => void;
  onClose?: () => void;
}

const AIVariableAssistant = ({ content, onContentUpdate, onClose }: AIVariableAssistantProps) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [placeholderMappings, setPlaceholderMappings] = useState<Array<{original: string, variable: string}>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleAnalyzeDocument = async () => {
    setIsAnalyzing(true);
    try {
      const result = await AIDocumentProcessor.analyzeDocument(content);
      setAnalysis(result);
      
      // Pre-populate placeholder mappings
      const mappings = result.placeholders.map(p => ({
        original: p.text,
        variable: p.suggestedVariable
      }));
      setPlaceholderMappings(mappings);
      
      toast({
        title: "Document Analyzed",
        description: `Found ${result.suggestions.length} variable suggestions and ${result.placeholders.length} placeholders`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze document",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSuggestionToggle = (variableName: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(variableName) 
        ? prev.filter(name => name !== variableName)
        : [...prev, variableName]
    );
  };

  const handlePlaceholderVariableChange = (original: string, newVariable: string) => {
    setPlaceholderMappings(prev => 
      prev.map(mapping => 
        mapping.original === original 
          ? { ...mapping, variable: newVariable }
          : mapping
      )
    );
  };

  const handleApplyChanges = () => {
    if (!analysis) return;

    let updatedContent = editedContent;
    let allVariables: string[] = [];

    // Apply variable suggestions
    if (selectedSuggestions.length > 0) {
      const suggestionResult = AIDocumentProcessor.applyVariableSuggestions(
        updatedContent, 
        analysis.suggestions, 
        selectedSuggestions
      );
      updatedContent = suggestionResult.content;
      allVariables = [...allVariables, ...suggestionResult.variables];
    }

    // Apply placeholder mappings
    if (placeholderMappings.length > 0) {
      const placeholderResult = AIDocumentProcessor.replacePlaceholders(
        updatedContent,
        placeholderMappings.filter(m => m.variable.trim() !== '')
      );
      updatedContent = placeholderResult.content;
      allVariables = [...allVariables, ...placeholderResult.variables];
    }

    // Remove duplicates
    const uniqueVariables = [...new Set(allVariables)];

    onContentUpdate(updatedContent, uniqueVariables);
    
    toast({
      title: "Variables Applied",
      description: `Applied ${uniqueVariables.length} variables to the document`,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'date': '📅',
      'name': '👤',
      'amount': '💰',
      'location': '📍',
      'reference': '📄',
      'address': '🏠',
      'other': '📝'
    };
    return icons[category as keyof typeof icons] || icons.other;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>AI Variable Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={handleAnalyzeDocument}
              disabled={isAnalyzing}
              className="flex-1"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isAnalyzing ? "Analyzing..." : "Analyze Document"}
            </Button>
            {analysis && (
              <Button onClick={handleApplyChanges} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Changes
              </Button>
            )}
          </div>

          {analysis && (
            <div className="space-y-6">
              {/* Variable Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>AI Variable Suggestions ({analysis.suggestions.length})</span>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analysis.suggestions.slice(0, 10).map((suggestion, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedSuggestions.includes(suggestion.variableName)}
                          onCheckedChange={() => handleSuggestionToggle(suggestion.variableName)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
                            <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                              {suggestion.originalText}
                            </code>
                            <span>→</span>
                            <Badge variant="outline">
                              {`{{${suggestion.variableName}}}`}
                            </Badge>
                            <Badge className={getConfidenceColor(suggestion.confidence)}>
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{suggestion.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Placeholder Mappings */}
              {analysis.placeholders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <Edit3 className="w-4 h-4" />
                    <span>Detected Placeholders ({analysis.placeholders.length})</span>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {placeholderMappings.map((mapping, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm min-w-fit">
                          {mapping.original}
                        </code>
                        <span>→</span>
                        <div className="flex-1">
                          <Input
                            value={mapping.variable}
                            onChange={(e) => handlePlaceholderVariableChange(mapping.original, e.target.value)}
                            placeholder="Enter variable name"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div className="space-y-2">
                <Label>Document Content (Editable)</Label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  You can manually edit the content above before applying AI suggestions
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIVariableAssistant;
