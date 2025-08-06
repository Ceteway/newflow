import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  Edit3, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  MapPin,
  Save
} from 'lucide-react';
import { SystemTemplate, SystemTemplateService } from '@/services/systemTemplateService';
import { TemplatePlaceholderService, DetectedPlaceholder } from '@/services/templatePlaceholderService';
import { ROF5FormData } from '@/hooks/useROF5Form';
import { useToast } from '@/hooks/use-toast';
import { DocumentGeneratorService } from '@/services/documentGeneratorService';

interface TemplatePreviewEditorProps {
  template: SystemTemplate | null;
  rof5Data: ROF5FormData;
  onDocumentGenerated?: (document: { name: string; content: Uint8Array }) => void;
}

const TemplatePreviewEditor: React.FC<TemplatePreviewEditorProps> = ({
  template,
  rof5Data,
  onDocumentGenerated
}) => {
  const { toast } = useToast();
  const [templateContent, setTemplateContent] = useState<string>('');
  const [detectedPlaceholders, setDetectedPlaceholders] = useState<DetectedPlaceholder[]>([]);
  const [filledContent, setFilledContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editableContent, setEditableContent] = useState<string>('');
  const [templateType, setTemplateType] = useState<string | null>(null);

  // Load template content when template changes
  useEffect(() => {
    if (template) {
      loadTemplateContent();
    } else {
      resetState();
    }
  }, [template]);

  // Auto-fill placeholders when ROF5 data changes
  useEffect(() => {
    if (templateContent && detectedPlaceholders.length > 0 && templateType) {
      fillPlaceholdersAutomatically();
    }
  }, [rof5Data, templateContent, detectedPlaceholders, templateType]);

  const resetState = () => {
    setTemplateContent('');
    setDetectedPlaceholders([]);
    setFilledContent('');
    setEditableContent('');
    setTemplateType(null);
  };

  const loadTemplateContent = async () => {
    if (!template) return;

    try {
      setIsLoadingContent(true);
      console.log('Loading template content for placeholder detection...');
      
      const content = await SystemTemplateService.extractTextFromTemplate(template);
      setTemplateContent(content);
      
      // Detect template type
      const detectedType = TemplatePlaceholderService.detectTemplateType(content);
      setTemplateType(detectedType);
      
      // Detect placeholders and mark them
      const { content: markedContent, placeholders } = TemplatePlaceholderService.detectPlaceholders(
        content, 
        detectedType || 'unknown'
      );
      
      setDetectedPlaceholders(placeholders);
      setEditableContent(markedContent);
      
      console.log(`Template type detected: ${detectedType}`);
      console.log(`Found ${placeholders.length} placeholders`);
      
      toast({
        title: "Template Loaded",
        description: `Detected ${placeholders.length} placeholders in ${template.name}`,
      });

    } catch (error) {
      console.error('Error loading template content:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load template content for editing",
        variant: "destructive"
      });
    } finally {
      setIsLoadingContent(false);
    }
  };

  const fillPlaceholdersAutomatically = () => {
    if (!templateType || detectedPlaceholders.length === 0) return;

    console.log('Auto-filling placeholders with ROF5 data...');
    
    const { content: autoFilledContent, filledPlaceholders } = TemplatePlaceholderService.fillPlaceholdersWithROF5(
      editableContent,
      detectedPlaceholders,
      rof5Data,
      templateType
    );
    
    setFilledContent(autoFilledContent);
    setDetectedPlaceholders(filledPlaceholders);
    
    const validation = TemplatePlaceholderService.validateFilledPlaceholders(filledPlaceholders);
    
    if (validation.isValid) {
      toast({
        title: "All Placeholders Filled",
        description: `Successfully filled ${filledPlaceholders.length} placeholders with ROF5 data`,
      });
    } else {
      toast({
        title: "Partial Fill Complete",
        description: `Filled ${filledPlaceholders.length - validation.unfilledCount} of ${filledPlaceholders.length} placeholders`,
      });
    }
  };

  const handleGenerateDocument = async () => {
    if (!template || !filledContent) {
      toast({
        title: "Cannot Generate",
        description: "Please select a template and fill placeholders first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      toast({
        title: "Generating Document",
        description: "Creating Word document with filled placeholders...",
      });

      // Generate document using the filled content
      const result = await DocumentGeneratorService.generateDocument(
        filledContent,
        [], // Variables already filled in content
        { format: 'docx', includeFormatting: true }
      );

      const documentName = `${template.name}_${rof5Data.siteCode || 'Generated'}_${new Date().toISOString().split('T')[0]}.docx`;
      
      if (onDocumentGenerated) {
        onDocumentGenerated({
          name: documentName,
          content: result.content as Uint8Array
        });
      }

      // Auto-download the document
      DocumentGeneratorService.downloadDocument(
        result.content as Uint8Array,
        documentName.replace('.docx', ''),
        'docx'
      );

      toast({
        title: "Document Generated",
        description: `${documentName} has been generated and downloaded`,
      });

    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPlaceholderStats = () => {
    const filled = detectedPlaceholders.filter(p => p.filled).length;
    const total = detectedPlaceholders.length;
    return { filled, total, percentage: total > 0 ? Math.round((filled / total) * 100) : 0 };
  };

  if (!template) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Please select a template to preview and edit placeholders.
        </AlertDescription>
      </Alert>
    );
  }

  const stats = getPlaceholderStats();

  return (
    <div className="space-y-4">
      {/* Template Info and Stats */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{template.name}</span>
              {templateType && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  {templateType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={stats.percentage === 100 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {stats.filled}/{stats.total} Filled
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Placeholder Fill Progress</span>
              <span className="text-green-700">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Template Preview: {template.name}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto">
                  {isLoadingContent ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading template preview...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-lg border max-h-96 overflow-auto">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: filledContent || TemplatePlaceholderService.generatePreviewContent(editableContent, detectedPlaceholders)
                        }}
                      />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showEditor} onOpenChange={setShowEditor}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Placeholders
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Edit Template Placeholders</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {stats.filled}/{stats.total} Filled
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4 h-[70vh]">
                  {/* Placeholder List */}
                  <div className="border-r pr-4 overflow-auto">
                    <h3 className="font-medium mb-3">Placeholders ({detectedPlaceholders.length})</h3>
                    <div className="space-y-2">
                      {detectedPlaceholders.map((placeholder) => (
                        <div
                          key={placeholder.id}
                          className={`p-3 border rounded-lg text-sm ${
                            placeholder.filled 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-yellow-200 bg-yellow-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">#{placeholder.order}</span>
                            {placeholder.filled ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                          <p className="text-gray-700 mb-1">{placeholder.description}</p>
                          {placeholder.filled && (
                            <p className="text-green-700 font-medium text-xs">
                              Value: {placeholder.value}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Content Editor */}
                  <div className="col-span-2 overflow-auto">
                    <div className="bg-white p-4 rounded-lg border h-full">
                      <div 
                        className="prose prose-sm max-w-none h-full overflow-auto"
                        dangerouslySetInnerHTML={{ 
                          __html: filledContent || editableContent
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {stats.percentage === 100 ? (
                      <span className="text-green-600 font-medium">All placeholders filled - ready to generate!</span>
                    ) : (
                      <span className="text-yellow-600">
                        {stats.total - stats.filled} placeholders remaining
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowEditor(false)}>
                      Close
                    </Button>
                    <Button 
                      onClick={handleGenerateDocument}
                      disabled={stats.percentage < 100 || isGenerating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Generate Document'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleGenerateDocument}
              disabled={stats.percentage < 100 || isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Document'}
            </Button>
          </div>

          {/* Placeholder Summary */}
          {detectedPlaceholders.length > 0 && (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Placeholder Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {detectedPlaceholders.slice(0, 6).map((placeholder) => (
                  <div key={placeholder.id} className="flex items-center space-x-2">
                    {placeholder.filled ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-yellow-600" />
                    )}
                    <span className="text-gray-700">
                      #{placeholder.order}: {placeholder.description}
                    </span>
                  </div>
                ))}
                {detectedPlaceholders.length > 6 && (
                  <div className="text-gray-500 text-xs">
                    ... and {detectedPlaceholders.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplatePreviewEditor;