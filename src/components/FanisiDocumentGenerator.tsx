import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Zap,
  Upload,
  Settings
} from 'lucide-react';
import { FanisiDocumentGenerator } from '@/services/fanisiDocumentGenerator';
import { SystemTemplateService, SystemTemplate } from '@/services/systemTemplateService';
import { ROF5FormData } from '@/hooks/useROF5Form';
import { FanisiROF5Data, FanisiValidationResult, FanisiGeneratedDocument } from '@/types/fanisi';
import { useToast } from '@/hooks/use-toast';

interface FanisiDocumentGeneratorProps {
  rof5Data: ROF5FormData;
  onDocumentGenerated?: (document: FanisiGeneratedDocument) => void;
}

const FanisiDocumentGeneratorComponent: React.FC<FanisiDocumentGeneratorProps> = ({
  rof5Data,
  onDocumentGenerated
}) => {
  const { toast } = useToast();
  const [systemTemplates, setSystemTemplates] = useState<SystemTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  const [fanisiData, setFanisiData] = useState<FanisiROF5Data | null>(null);
  const [validationResult, setValidationResult] = useState<FanisiValidationResult | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<FanisiGeneratedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Load system templates on component mount
  useEffect(() => {
    loadSystemTemplates();
  }, []);

  // Convert ROF5 data to Fanisi format when component mounts or data changes
  useEffect(() => {
    if (rof5Data) {
      const converted = FanisiDocumentGenerator.convertROF5ToFanisi(rof5Data);
      setFanisiData(converted);
    }
  }, [rof5Data]);

  const loadSystemTemplates = async () => {
    try {
      setIsLoading(true);
      const templates = await SystemTemplateService.getAllSystemTemplates();
      setSystemTemplates(templates);
      console.log(`Loaded ${templates.length} system templates for Fanisi generator`);
    } catch (error) {
      console.error('Error loading system templates:', error);
      toast({
        title: "Template Loading Failed",
        description: "Failed to load system templates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = async (template: SystemTemplate) => {
    if (!fanisiData) {
      toast({
        title: "No ROF5 Data",
        description: "Please fill out the ROF5 form first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setSelectedTemplate(template);
      
      // Extract template content and validate
      const templateContent = await SystemTemplateService.extractTextFromTemplate(template);
      const templateVariables = await FanisiDocumentGenerator.extractTemplateVariables(templateContent);
      const validation = FanisiDocumentGenerator.validateROF5Data(fanisiData, templateVariables);
      
      setValidationResult(validation);
      
      if (!validation.isValid) {
        setShowValidationDialog(true);
      } else {
        toast({
          title: "Template Validated",
          description: `Template "${template.name}" is ready for document generation`,
        });
      }
    } catch (error) {
      console.error('Error validating template:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to validate template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate || !fanisiData || !validationResult?.isValid) {
      toast({
        title: "Cannot Generate Document",
        description: "Please select a valid template and ensure all required fields are filled",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const document = await FanisiDocumentGenerator.generateDocument(
        selectedTemplate.file_data,
        fanisiData
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setGeneratedDocument(document);
      
      // Log the generation
      FanisiDocumentGenerator.logGeneration(document, 'success');
      
      if (onDocumentGenerated) {
        onDocumentGenerated(document);
      }

      toast({
        title: "Document Generated Successfully",
        description: `${document.fileName} is ready for download`,
      });

    } catch (error) {
      console.error('Error generating document:', error);
      
      if (selectedTemplate && fanisiData) {
        const errorDoc: FanisiGeneratedDocument = {
          id: 'error',
          fileName: 'error.docx',
          content: new Uint8Array(),
          documentType: fanisiData.Document_Type,
          siteName: fanisiData.Site_Name,
          generatedAt: new Date().toISOString()
        };
        
        FanisiDocumentGenerator.logGeneration(
          errorDoc, 
          'error', 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate document",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleDownloadDocument = () => {
    if (generatedDocument) {
      FanisiDocumentGenerator.downloadDocument(generatedDocument);
    }
  };

  const getValidationStatusBadge = () => {
    if (!validationResult) return null;
    
    if (validationResult.isValid) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Valid
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {validationResult.missingFields.length} Missing Fields
        </Badge>
      );
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-purple-600" />
            <span>Fanisi Legal Document Generator</span>
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              AI-Powered
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {getValidationStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-800">1. Select DOCX Template</h3>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading templates...</p>
            </div>
          ) : systemTemplates.length === 0 ? (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                No system templates available. Please upload DOCX templates to use this feature.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <span>{template.file_name}</span>
                        <span>•</span>
                        <span>{template.category}</span>
                      </div>
                    </div>
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROF5 Data Summary */}
        {fanisiData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-800">2. ROF5 Data Summary</h3>
            <div className="bg-white p-4 rounded-lg border">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Site:</span> {fanisiData.Site_Name}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {fanisiData.Property_Location}
                </div>
                <div>
                  <span className="font-medium">Landlord:</span> {fanisiData.Landlord_Name}
                </div>
                <div>
                  <span className="font-medium">Term:</span> {fanisiData.Term_Years} years
                </div>
                <div>
                  <span className="font-medium">Base Rent:</span> KES {parseFloat(fanisiData.Base_Rent || '0').toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Document Type:</span> {fanisiData.Document_Type}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generation Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-800">3. Generate Document</h3>
          
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating document...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleGenerateDocument}
              disabled={!selectedTemplate || !validationResult?.isValid || isGenerating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Document'}
            </Button>
            
            {generatedDocument && (
              <Button
                onClick={handleDownloadDocument}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download {generatedDocument.fileName}
              </Button>
            )}
          </div>
        </div>

        {/* Generated Document Info */}
        {generatedDocument && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">Document Generated Successfully</h4>
            </div>
            <div className="text-sm text-green-700">
              <p><strong>File:</strong> {generatedDocument.fileName}</p>
              <p><strong>Type:</strong> {generatedDocument.documentType}</p>
              <p><strong>Site:</strong> {generatedDocument.siteName}</p>
              <p><strong>Generated:</strong> {new Date(generatedDocument.generatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Template Validation Issues</span>
            </DialogTitle>
          </DialogHeader>
          
          {validationResult && (
            <div className="space-y-4">
              {validationResult.missingFields.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Missing Required Fields:</h4>
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {validationResult.missingFields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {validationResult.unmappedVariables.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Unmapped Template Variables:</h4>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {validationResult.unmappedVariables.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FanisiDocumentGeneratorComponent;