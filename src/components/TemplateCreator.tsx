
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TemplateService } from "@/services/templateService";
import { TemplateCategory } from "@/types/database";
import AIVariableAssistant from "./AIVariableAssistant";
import { 
  FileText, 
  Upload, 
  X,
  Wand2,
  Plus,
  Bot,
  Edit3
} from "lucide-react";
import mammoth from "mammoth";

interface TemplateCreatorProps {
  onClose: () => void;
  onTemplateCreated: () => void;
}

const TemplateCreator = ({ onClose, onTemplateCreated }: TemplateCreatorProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'agreements' as TemplateCategory,
    content: ''
  });
  const [extractedVariables, setExtractedVariables] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      let text = '';
      
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
        
        if (result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages);
        }
      } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
        text = await file.text();
      } else {
        text = await file.text();
      }

      setFormData(prev => ({ ...prev, content: text }));
      
      if (!formData.name) {
        const filename = file.name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, name: filename }));
      }

      setShowEditor(true);
      setShowAIAssistant(true);

      toast({
        title: "File Uploaded Successfully",
        description: `Document content extracted. Use AI Assistant to detect variables automatically.`,
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not read the file content. Please try a different file format.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAIContentUpdate = (content: string, variables: string[]) => {
    setFormData(prev => ({ ...prev, content }));
    setExtractedVariables(variables);
    
    toast({
      title: "AI Processing Complete",
      description: `Applied ${variables.length} variables to the document`,
    });
  };

  const handleAutoExtractVariables = () => {
    if (!formData.content) {
      toast({
        title: "No Content",
        description: "Please add template content first",
        variant: "destructive"
      });
      return;
    }

    const variables = TemplateService.extractVariablesFromContent(formData.content);
    setExtractedVariables(variables);
    
    toast({
      title: "Variables Extracted",
      description: `Found ${variables.length} variables`,
    });
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.content) {
      toast({
        title: "Missing Information",
        description: "Please provide template name and content",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await TemplateService.createTemplate({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        content: formData.content,
        variables: extractedVariables
      });

      toast({
        title: "Template Created",
        description: "Your template has been saved successfully",
      });

      onTemplateCreated();
      onClose();
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Could not create the template",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const removeVariable = (variableToRemove: string) => {
    setExtractedVariables(prev => prev.filter(v => v !== variableToRemove));
  };

  const addCustomVariable = () => {
    const variableName = prompt("Enter variable name (without curly braces):");
    if (variableName && variableName.trim()) {
      const cleanName = variableName.trim().replace(/[{}]/g, '');
      if (!extractedVariables.includes(cleanName)) {
        setExtractedVariables(prev => [...prev, cleanName]);
        
        const placeholder = `{{${cleanName}}}`;
        if (!formData.content.includes(placeholder)) {
          setFormData(prev => ({
            ...prev,
            content: prev.content + `\n${placeholder}`
          }));
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Create New Template</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[calc(95vh-120px)] overflow-y-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value: TemplateCategory) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agreements">Agreements</SelectItem>
                  <SelectItem value="forms">Forms</SelectItem>
                  <SelectItem value="letters">Letters</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the template"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload Document</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Upload a Word document (.docx, .doc) or text file</p>
              <p className="text-xs text-gray-500 mb-2">AI will automatically detect variables and placeholders</p>
              <input
                type="file"
                accept=".doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button variant="outline" asChild disabled={isExtracting}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  {isExtracting ? "Processing..." : "Choose File"}
                </label>
              </Button>
            </div>
          </div>

          {/* AI Variable Assistant */}
          {showAIAssistant && formData.content && (
            <div className="border-t pt-6">
              <AIVariableAssistant
                content={formData.content}
                onContentUpdate={handleAIContentUpdate}
              />
            </div>
          )}

          {/* Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Template Content *</Label>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  disabled={!formData.content}
                >
                  <Bot className="w-4 h-4 mr-2" />
                  {showAIAssistant ? "Hide AI Assistant" : "Show AI Assistant"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAutoExtractVariables}
                  disabled={!formData.content}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Extract Variables
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addCustomVariable}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variable
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditor(!showEditor)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {showEditor ? "Hide Editor" : "Show Editor"}
                </Button>
              </div>
            </div>
            
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter your template content or upload a document above. The AI will help detect variables and placeholders automatically."
              rows={showEditor ? 12 : 8}
              className={showEditor ? "font-mono text-sm" : ""}
            />
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Use double curly braces for variables: {`{{landlord_name}}, {{site_location}}, {{current_date}}`}</span>
              {formData.content.length > 0 && (
                <span>{formData.content.length} characters</span>
              )}
            </div>
          </div>

          {/* Extracted Variables */}
          {extractedVariables.length > 0 && (
            <div className="space-y-2">
              <Label>Template Variables ({extractedVariables.length})</Label>
              <div className="flex flex-wrap gap-2">
                {extractedVariables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="flex items-center space-x-1">
                    <span>{variable}</span>
                    <button
                      onClick={() => removeVariable(variable)}
                      className="text-gray-500 hover:text-red-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                These variables will be available for editing when generating documents from this template.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate}
              disabled={isCreating || !formData.name || !formData.content}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateCreator;
