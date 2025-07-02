
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AIDocumentProcessor } from "@/services/aiDocumentProcessor";
import { DocumentGeneratorService } from "@/services/documentGeneratorService";
import { TemplateService } from "@/services/templateService";
import { DocumentVariable } from "@/types/database";
import { 
  Edit3, 
  Save, 
  Download, 
  Eye,
  Wand2,
  X
} from "lucide-react";

interface LiveTemplateEditorProps {
  template: {
    id: string;
    name: string;
    content: string;
    variables: string[];
  };
  onClose: () => void;
  onSave?: (updatedTemplate: any) => void;
}

const LiveTemplateEditor = ({ template, onClose, onSave }: LiveTemplateEditorProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState(template.content);
  const [variables, setVariables] = useState<DocumentVariable[]>(
    template.variables.map(key => ({ key, value: '' }))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const [variableName, setVariableName] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    generatePreview();
  }, [content, variables]);

  const generatePreview = async () => {
    try {
      const result = await DocumentGeneratorService.generateDocument(
        content,
        variables,
        { format: 'text', includeFormatting: true }
      );
      setPreviewContent(result.content);
    } catch (error) {
      console.error('Preview generation failed:', error);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Extract variables from updated content
    const extractedVars = TemplateService.extractVariablesFromContent(newContent);
    const updatedVariables = extractedVars.map(key => {
      const existing = variables.find(v => v.key === key);
      return existing || { key, value: '' };
    });
    setVariables(updatedVariables);
  };

  const handlePlaceholderClick = (placeholder: string, context: string) => {
    setSelectedPlaceholder(placeholder);
    const suggestedName = AIDocumentProcessor.generateSmartVariableName(context, placeholder);
    setVariableName(suggestedName);
  };

  const handleReplacePlaceholder = () => {
    if (!selectedPlaceholder || !variableName) return;

    const placeholder = `{{${variableName}}}`;
    const updatedContent = content.replace(selectedPlaceholder, placeholder);
    setContent(updatedContent);
    
    // Add to variables if not exists
    if (!variables.find(v => v.key === variableName)) {
      setVariables(prev => [...prev, { key: variableName, value: '' }]);
    }

    setSelectedPlaceholder(null);
    setVariableName('');

    toast({
      title: "Placeholder Replaced",
      description: `Replaced with variable: ${variableName}`,
    });
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => 
      prev.map(variable => 
        variable.key === key ? { ...variable, value } : variable
      )
    );
  };

  const handleAIDetectPlaceholders = async () => {
    try {
      const analysis = await AIDocumentProcessor.analyzeDocument(content);
      
      if (analysis.placeholders.length > 0) {
        // Apply AI suggestions
        const mappings = analysis.placeholders.map(p => ({
          original: p.text,
          variable: p.suggestedVariable
        }));
        
        const result = AIDocumentProcessor.replacePlaceholders(content, mappings);
        setContent(result.content);
        
        // Update variables
        const newVariables = result.variables.map(key => ({
          key,
          value: variables.find(v => v.key === key)?.value || ''
        }));
        setVariables(newVariables);

        toast({
          title: "AI Detection Complete",
          description: `Detected and replaced ${analysis.placeholders.length} placeholders`,
        });
      } else {
        toast({
          title: "No Placeholders Found",
          description: "AI didn't detect any placeholders to replace",
        });
      }
    } catch (error) {
      toast({
        title: "AI Detection Failed",
        description: "Could not analyze document",
        variant: "destructive"
      });
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const updatedTemplate = await TemplateService.updateTemplate(template.id, {
        content,
        variables: variables.map(v => v.key)
      });

      if (onSave) {
        onSave(updatedTemplate);
      }

      toast({
        title: "Template Saved",
        description: "Template has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save template",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    try {
      const result = await DocumentGeneratorService.generateDocument(
        content,
        variables,
        { format: 'docx', includeFormatting: true }
      );
      
      DocumentGeneratorService.downloadDocument(result.content, template.name, 'docx');
      
      toast({
        title: "Document Downloaded",
        description: "Document has been generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not generate document",
        variant: "destructive"
      });
    }
  };

  const renderHighlightedContent = () => {
    const highlightedContent = AIDocumentProcessor.highlightPlaceholders(content);
    
    return (
      <div
        className="min-h-[400px] p-4 border rounded-lg bg-white font-mono text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.hasAttribute('data-placeholder')) {
            const placeholder = target.getAttribute('data-placeholder') || '';
            const context = target.parentElement?.textContent || '';
            handlePlaceholderClick(placeholder, context);
          }
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Editor Panel */}
          <Card className="border-0 rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-5 h-5" />
                  <span>{template.name} - Live Editor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAIDetectPlaceholders}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Detect
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Template Content (Click green highlights to convert to variables)</Label>
                {isEditing ? (
                  <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full min-h-[400px] p-4 border rounded-lg font-mono text-sm"
                    placeholder="Enter template content..."
                  />
                ) : (
                  renderHighlightedContent()
                )}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "View Highlights" : "Edit Text"}
                  </Button>
                  <Button size="sm" onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>

              {/* Variable Editor */}
              {variables.length > 0 && (
                <div className="space-y-3">
                  <Label>Template Variables ({variables.length})</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {variables.map((variable) => (
                      <div key={variable.key} className="flex items-center space-x-2">
                        <Badge variant="outline" className="min-w-fit">
                          {variable.key}
                        </Badge>
                        <Input
                          value={variable.value}
                          onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                          placeholder={`Enter ${variable.key.replace(/_/g, ' ')}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download Word
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="border-0 rounded-none border-l">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Live Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
                <div 
                  className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed"
                  style={{ fontFamily: 'Times New Roman, serif' }}
                >
                  {previewContent || "Fill in the variables to see preview..."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Placeholder Replacement Modal */}
      {selectedPlaceholder && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60]">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Replace Placeholder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Placeholder</Label>
                <code className="block bg-gray-100 p-2 rounded text-sm">
                  {selectedPlaceholder}
                </code>
              </div>
              <div>
                <Label>Variable Name</Label>
                <Input
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value)}
                  placeholder="Enter variable name"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlaceholder(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReplacePlaceholder}
                  disabled={!variableName}
                  className="flex-1"
                >
                  Replace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveTemplateEditor;
