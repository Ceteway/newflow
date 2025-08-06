import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Upload, 
  Eye, 
  Download,
  CheckCircle,
  Settings,
  Zap
} from 'lucide-react';
import { SystemTemplate } from '@/services/systemTemplateService';
import { ROF5FormData } from '@/hooks/useROF5Form';
import TemplateUploadManager from './TemplateUploadManager';
import TemplatePreviewEditor from './TemplatePreviewEditor';
import { useToast } from '@/hooks/use-toast';

interface EnhancedTemplateSelectorProps {
  rof5Data: ROF5FormData;
  onDocumentGenerated?: (document: { name: string; content: Uint8Array }) => void;
}

const EnhancedTemplateSelector: React.FC<EnhancedTemplateSelectorProps> = ({
  rof5Data,
  onDocumentGenerated
}) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  const [showUploadManager, setShowUploadManager] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<{ name: string; content: Uint8Array }[]>([]);

  const handleTemplateUploaded = (template: SystemTemplate) => {
    toast({
      title: "Template Ready",
      description: `${template.name} is now available for document generation`,
    });
  };

  const handleTemplateSelected = (template: SystemTemplate) => {
    setSelectedTemplate(template);
    toast({
      title: "Template Selected",
      description: `Selected ${template.name} for document generation`,
    });
  };

  const handleDocumentGenerated = (document: { name: string; content: Uint8Array }) => {
    setGeneratedDocuments(prev => [...prev, document]);
    
    if (onDocumentGenerated) {
      onDocumentGenerated(document);
    }
    
    toast({
      title: "Document Generated",
      description: `${document.name} has been generated successfully`,
    });
  };

  const handleDownloadDocument = (document: { name: string; content: Uint8Array }) => {
    try {
      const blob = new Blob([document.content], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = document.name;
      link.style.display = 'none';
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${document.name}...`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-purple-600" />
              <span>Enhanced Template System</span>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                Systematic Placeholder Detection
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowUploadManager(!showUploadManager)}
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showUploadManager ? 'Hide' : 'Show'} Template Manager
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <FileText className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Systematic Placeholder Detection:</strong> Upload your DOCX templates and the system will automatically detect placeholders (marked with dots: ………) in the exact order you specified. Each placeholder will be filled systematically with ROF5 data and highlighted in green for easy verification.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Template Upload Manager */}
      {showUploadManager && (
        <TemplateUploadManager
          onTemplateUploaded={handleTemplateUploaded}
          onTemplateSelected={handleTemplateSelected}
        />
      )}

      {/* Template Preview and Editor */}
      {selectedTemplate && (
        <TemplatePreviewEditor
          template={selectedTemplate}
          rof5Data={rof5Data}
          onDocumentGenerated={handleDocumentGenerated}
        />
      )}

      {/* Generated Documents */}
      {generatedDocuments.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Generated Documents ({generatedDocuments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-600">
                        Size: {(doc.content.length / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadDocument(doc)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedTemplateSelector;