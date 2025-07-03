
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
  Plus,
  Eye,
  FileText,
  Upload
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

  const handleAnalyzeTemplate = async () => {
    if (!content || content.trim() === '') {
      toast({
        title: "No Template Content",
        description: "Please upload a template document first before using AI analysis",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await AIDocumentProcessor.analyzeDocument(content);
      setAnalysis(result);
      
      // Pre-populate placeholder mappings with intelligent suggestions
      const mappings = result.placeholders.map(p => ({
        original: p.text,
        variable: p.suggestedVariable
      }));
      setPlaceholderMappings(mappings);
      
      toast({
        title: "Template Analysis Complete",
        description: `Found ${result.suggestions.length} data patterns and ${result.placeholders.length} template variables to convert`,
      });
    } catch (error) {
      console.error('Template analysis error:', error);
      toast({
        title: "Template Analysis Failed",
        description: "Could not analyze the uploaded template",
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

  const handleApplyTemplateChanges = () => {
    if (!analysis) return;

    let updatedContent = editedContent;
    let allVariables: string[] = [];

    // Apply variable suggestions first
    if (selectedSuggestions.length > 0) {
      const suggestionResult = AIDocumentProcessor.applyVariableSuggestions(
        updatedContent, 
        analysis.suggestions, 
        selectedSuggestions
      );
      updatedContent = suggestionResult.content;
      allVariables = [...allVariables, ...suggestionResult.variables];
    }

    // Apply placeholder mappings (blank line conversions)
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
      title: "Template Variables Applied",
      description: `Converted ${uniqueVariables.length} template fields into variables. Your template is now ready for document generation.`,
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

  if (!content || content.trim() === '') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>AI Template Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Upload a template document to get started</p>
          <p className="text-sm text-gray-500">
            AI will analyze your uploaded template and convert blank fields into variables
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>AI Template Variable Converter</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Automatically converts blank fields in your uploaded template (dots, dashes, underscores, brackets) 
            into fillable variables for document generation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={handleAnalyzeTemplate}
              disabled={isAnalyzing}
              className="flex-1"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isAnalyzing ? "Analyzing Template..." : "Analyze Template Variables"}
            </Button>
            {analysis && (
              <Button onClick={handleApplyTemplateChanges} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply to Template
              </Button>
            )}
          </div>

          {analysis && (
            <div className="space-y-6">
              {/* Template Variable Fields */}
              {analysis.placeholders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <Edit3 className="w-4 h-4" />
                    <span>Template Variables Found ({analysis.placeholders.length})</span>
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {placeholderMappings.map((mapping, index) => {
                      const placeholder = analysis.placeholders.find(p => p.text === mapping.original);
                      return (
                        <div key={index} className="p-4 border rounded-lg bg-blue-50">
                          <div className="flex items-start space-x-3 mb-2">
                            <span className="text-lg">{getCategoryIcon(placeholder?.category || 'other')}</span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">
                                  {mapping.original}
                                </code>
                                <span>→</span>
                                <Badge variant="outline">
                                  {`{{${mapping.variable}}}`}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800">
                                  {placeholder?.category || 'field'}
                                </Badge>
                              </div>
                              {placeholder?.contextPreview && (
                                <p className="text-xs text-gray-600 bg-white p-2 rounded border italic">
                                  Template context: "{placeholder.contextPreview}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-8">
                            <Input
                              value={mapping.variable}
                              onChange={(e) => handlePlaceholderVariableChange(mapping.original, e.target.value)}
                              placeholder="Enter variable name for template"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Data Pattern Suggestions for Templates */}
              {analysis.suggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Template Data Patterns ({analysis.suggestions.length})</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    These existing data values can be converted to template variables for reuse
                  </p>
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
                          {suggestion.contextPreview && (
                            <p className="text-xs text-gray-500 italic mt-1">"{suggestion.contextPreview}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Content Preview */}
              <div className="space-y-2">
                <Label>Template Content (Editable)</Label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="Your template content will appear here..."
                />
                <p className="text-xs text-gray-500">
                  Edit your template content above before applying AI variable suggestions
                </p>
              </div>
            </div>
          )}

          {analysis?.placeholders.length === 0 && analysis?.suggestions.length === 0 && analysis && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                This template appears to be complete with no blank fields detected.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                The template may already have all variables defined or use a different placeholder format.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIVariableAssistant;
