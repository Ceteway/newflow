import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TemplateService } from "@/services/templateService";
import { DocumentGeneratorService } from "@/services/documentGeneratorService";
import { DocumentVariable } from "@/types/database";
import { 
  FileText, 
  Download, 
  Wand2, 
  Copy,
  Eye,
  FileDown
} from "lucide-react";

interface TemplateData {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

interface TemplateVariableEditorProps {
  template: TemplateData;
  onClose: () => void;
}

const TemplateVariableEditor = ({ template, onClose }: TemplateVariableEditorProps) => {
  const { toast } = useToast();
  const [variables, setVariables] = useState<DocumentVariable[]>(
    template.variables.map(key => ({ key, value: '' }))
  );
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'text' | 'html' | 'docx'>('docx');

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
      // Enhanced AI auto-fill with better suggestions
      const updatedVariables = variables.map(variable => {
        if (!variable.value) {
          let defaultValue = '';
          
          // Smart defaults based on variable name patterns
          const varName = variable.key.toLowerCase();
          
          if (varName.includes('date') || varName.includes('commencement') || varName.includes('expiry')) {
            if (varName.includes('commencement') || varName.includes('start')) {
              defaultValue = new Date().toLocaleDateString('en-GB');
            } else if (varName.includes('expiry') || varName.includes('end')) {
              const futureDate = new Date();
              futureDate.setFullYear(futureDate.getFullYear() + 5);
              defaultValue = futureDate.toLocaleDateString('en-GB');
            } else {
              defaultValue = new Date().toLocaleDateString('en-GB');
            }
          } else if (varName.includes('landlord') && varName.includes('name')) {
            defaultValue = 'John Doe';
          } else if (varName.includes('tenant') && varName.includes('name')) {
            defaultValue = 'SAFARICOM PLC';
          } else if (varName.includes('address')) {
            if (varName.includes('tenant') || varName.includes('safaricom')) {
              defaultValue = 'Safaricom House, Waiyaki Way, Westlands, P.O. Box 66827-00800, Nairobi';
            } else {
              defaultValue = '123 Main Street, Nairobi, Kenya';
            }
          } else if (varName.includes('rent') || varName.includes('amount') || varName.includes('fee')) {
            defaultValue = '50000';
          } else if (varName.includes('site') && varName.includes('location')) {
            defaultValue = 'Westlands, Nairobi';
          } else if (varName.includes('site') && varName.includes('code')) {
            defaultValue = 'WLD001';
          } else if (varName.includes('lease') && varName.includes('term')) {
            defaultValue = '10';
          } else if (varName.includes('escalation') && varName.includes('rate')) {
            defaultValue = '5';
          } else if (varName.includes('title') && varName.includes('number')) {
            defaultValue = 'NAIROBI/BLOCK1/123';
          } else if (varName.includes('email')) {
            defaultValue = 'example@safaricom.co.ke';
          } else if (varName.includes('phone')) {
            defaultValue = '+254 700 000 000';
          } else if (varName.includes('id') || varName.includes('number')) {
            defaultValue = '12345678';
          } else {
            defaultValue = `Sample ${variable.key.replace(/_/g, ' ')}`;
          }
          
          return { ...variable, value: defaultValue };
        }
        return variable;
      });

      setVariables(updatedVariables);

      toast({
        title: "AI Auto-fill Complete",
        description: "Variables have been populated with intelligent suggestions",
      });
    } catch (error) {
      console.error('AI auto-fill failed:', error);
      toast({
        title: "Auto-fill Failed",
        description: "Could not generate suggestions",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    try {
      const result = await DocumentGeneratorService.generateDocument(
        template.content,
        variables,
        { format: 'text', includeFormatting: true }
      );
      
      setGeneratedContent(result.content as string);
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Could not generate document preview",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    try {
      const result = await DocumentGeneratorService.generateDocument(
        template.content,
        variables,
        { format: downloadFormat, includeFormatting: true }
      );
      
      const filename = `${template.name}_${new Date().getTime()}`;
      DocumentGeneratorService.downloadDocument(result.content, filename, downloadFormat);
      
      // Also save to database
      await TemplateService.generateDocument(template.id, variables);
      
      toast({
        title: "Document Generated",
        description: `${template.name} has been generated and downloaded as ${downloadFormat.toUpperCase()} format`,
      });
    } catch (error) {
      console.error('Download failed:', error);
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
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
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
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                {variables.map((variable) => (
                  <div key={variable.key} className="space-y-2">
                    <Label htmlFor={variable.key} className="flex items-center space-x-2">
                      <span className="capitalize">{variable.key.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-xs">
                        {`{{${variable.key}}}`}
                      </Badge>
                    </Label>
                    {variable.key.includes('address') || 
                     variable.key.includes('conditions') || 
                     variable.key.includes('terms') || 
                     variable.key.includes('description') ? (
                      <Textarea
                        id={variable.key}
                        value={variable.value}
                        onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                        placeholder={`Enter ${variable.key.replace(/_/g, ' ')}`}
                        rows={3}
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
              
              {/* Download Format Selection */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Download Format</Label>
                <Select value={downloadFormat} onValueChange={(value: 'text' | 'html' | 'docx') => setDownloadFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docx">Word Document (.docx)</SelectItem>
                    <SelectItem value="html">HTML Document (.html)</SelectItem>
                    <SelectItem value="text">Text Document (.txt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handlePreview} variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={handleDownload} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <FileDown className="w-4 h-4 mr-2" />
                  Download {downloadFormat.toUpperCase()}
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
              <div className="bg-gray-50 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
                {generatedContent ? (
                  <div 
                    className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed"
                    style={{ fontFamily: 'Times New Roman, serif' }}
                  >
                    {generatedContent}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Click "Preview" to generate document content</p>
                    <p className="text-xs mt-2">Fill in the variables on the left and preview the generated document here</p>
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
