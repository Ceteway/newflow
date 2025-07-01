
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DocumentTemplate, DocumentVariable, DocumentGenerator } from "@/services/documentGenerator";
import { AIService } from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Wand2, 
  Copy,
  Eye
} from "lucide-react";

interface TemplateVariableEditorProps {
  template: DocumentTemplate;
  onClose: () => void;
}

const TemplateVariableEditor = ({ template, onClose }: TemplateVariableEditorProps) => {
  const { toast } = useToast();
  const [variables, setVariables] = useState<DocumentVariable[]>(
    template.variables.map(key => ({ key, value: '' }))
  );
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => 
      prev.map(variable => 
        variable.key === key ? { ...variable, value } : variable
      )
    );
  };

  const handleAIAutoFill = async () => {
    setIsGenerating(true);
    try {
      // Create form data from current variables
      const formData = variables.reduce((acc, variable) => {
        acc[variable.key] = variable.value;
        return acc;
      }, {} as any);

      // Get AI suggestions for empty fields
      const emptyVariables = variables.filter(v => !v.value);
      
      for (const variable of emptyVariables) {
        const suggestions = await AIService.getFormSuggestions(formData, variable.key);
        if (suggestions.length > 0) {
          const bestSuggestion = suggestions[0];
          setVariables(prev => 
            prev.map(v => 
              v.key === variable.key ? { ...v, value: bestSuggestion.value } : v
            )
          );
          formData[variable.key] = bestSuggestion.value;
        }
      }

      toast({
        title: "AI Auto-fill Complete",
        description: "Variables have been populated with AI suggestions",
      });
    } catch (error) {
      console.error('AI auto-fill failed:', error);
      toast({
        title: "Auto-fill Failed",
        description: "Could not generate AI suggestions",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    try {
      const content = DocumentGenerator.populateTemplate(template.id, variables);
      setGeneratedContent(content);
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Could not generate document preview",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    try {
      const content = DocumentGenerator.populateTemplate(template.id, variables);
      const filename = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
      DocumentGenerator.downloadDocument(content, filename);
      
      toast({
        title: "Document Downloaded",
        description: `${template.name} has been generated and downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not generate document",
        variant: "destructive"
      });
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied to Clipboard",
        description: "Document content copied successfully",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Variable Editor */}
          <Card className="border-0 rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{template.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAIAutoFill}
                    disabled={isGenerating}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGenerating ? "AI Filling..." : "AI Auto-fill"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    ×
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {variables.map((variable) => (
                  <div key={variable.key} className="space-y-2">
                    <Label htmlFor={variable.key} className="flex items-center space-x-2">
                      <span className="capitalize">{variable.key.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-xs">
                        {`{{${variable.key}}}`}
                      </Badge>
                    </Label>
                    {variable.key.includes('address') || variable.key.includes('conditions') ? (
                      <Textarea
                        id={variable.key}
                        value={variable.value}
                        onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                        placeholder={`Enter ${variable.key.replace(/_/g, ' ')}`}
                        rows={2}
                      />
                    ) : (
                      <Input
                        id={variable.key}
                        value={variable.value}
                        onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                        placeholder={`Enter ${variable.key.replace(/_/g, ' ')}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handlePreview} variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={handleDownload} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="border-0 rounded-none border-l">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Document Preview</span>
                {generatedContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyToClipboard}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                {generatedContent ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {generatedContent}
                  </pre>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Click "Preview" to generate document content</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemplateVariableEditor;
