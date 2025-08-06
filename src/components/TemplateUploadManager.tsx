import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Trash2,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { SystemTemplateService, SystemTemplate, CreateSystemTemplateData } from '@/services/systemTemplateService';
import { TemplateCategory } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { validateDocumentFile, sanitizeFileName } from '@/utils/templates/documentParser';

interface TemplateUploadManagerProps {
  onTemplateUploaded?: (template: SystemTemplate) => void;
  onTemplateSelected?: (template: SystemTemplate) => void;
}

const TemplateUploadManager: React.FC<TemplateUploadManagerProps> = ({
  onTemplateUploaded,
  onTemplateSelected
}) => {
  const { toast } = useToast();
  const [systemTemplates, setSystemTemplates] = useState<SystemTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'agreements' as TemplateCategory,
    file: null as File | null
  });

  // Load templates on component mount
  React.useEffect(() => {
    loadSystemTemplates();
  }, []);

  const loadSystemTemplates = async () => {
    try {
      setIsLoading(true);
      const templates = await SystemTemplateService.getAllSystemTemplates();
      setSystemTemplates(templates);
      console.log(`Loaded ${templates.length} system templates`);
    } catch (error) {
      console.error('Error loading system templates:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load system templates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateDocumentFile(file)) {
        toast({
          title: "Invalid File",
          description: "Please select a valid .docx or .doc file (max 10MB)",
          variant: "destructive"
        });
        return;
      }

      setUploadForm(prev => ({
        ...prev,
        file,
        name: prev.name || sanitizeFileName(file.name)
      }));
    }
  }, [toast]);

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and provide a template name",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert file to Uint8Array
      const arrayBuffer = await uploadForm.file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      const templateData: CreateSystemTemplateData = {
        name: uploadForm.name.trim(),
        description: uploadForm.description.trim() || undefined,
        category: uploadForm.category,
        file_name: uploadForm.file.name,
        file_data: fileData,
        content_type: uploadForm.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      const uploadedTemplate = await SystemTemplateService.uploadSystemTemplate(templateData);
      
      // Refresh templates list
      await loadSystemTemplates();
      
      // Reset form
      setUploadForm({
        name: '',
        description: '',
        category: 'agreements',
        file: null
      });
      
      setShowUploadDialog(false);
      
      toast({
        title: "Template Uploaded",
        description: `Template "${uploadedTemplate.name}" has been uploaded successfully`,
      });

      if (onTemplateUploaded) {
        onTemplateUploaded(uploadedTemplate);
      }

    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload template",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAllTemplates = async () => {
    try {
      setIsLoading(true);
      const deletedCount = await SystemTemplateService.deleteAllSystemTemplates();
      
      // Refresh templates list
      await loadSystemTemplates();
      
      toast({
        title: "Templates Deleted",
        description: `Successfully deleted ${deletedCount} system templates`,
      });
    } catch (error) {
      console.error('Error deleting templates:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete system templates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: SystemTemplate) => {
    setSelectedTemplate(template);
    if (onTemplateSelected) {
      onTemplateSelected(template);
    }
    toast({
      title: "Template Selected",
      description: `Selected template: ${template.name}`,
    });
  };

  const handleDownloadTemplate = (template: SystemTemplate) => {
    try {
      SystemTemplateService.downloadTemplate(template);
      toast({
        title: "Download Started",
        description: `Downloading ${template.name}...`,
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download template",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Template Manager</span>
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              System Templates
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSystemTemplates}
              disabled={isLoading}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload New Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-file">Template File (.docx)</Label>
                    <Input
                      id="template-file"
                      type="file"
                      accept=".docx,.doc"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    {uploadForm.file && (
                      <p className="text-sm text-green-600 mt-1">
                        Selected: {uploadForm.file.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select 
                      value={uploadForm.category} 
                      onValueChange={(value: TemplateCategory) => 
                        setUploadForm(prev => ({ ...prev, category: value }))
                      }
                    >
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
                  
                  <div>
                    <Label htmlFor="template-description">Description (Optional)</Label>
                    <Textarea
                      id="template-description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this template..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowUploadDialog(false)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={isUploading || !uploadForm.file || !uploadForm.name.trim()}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Template'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Management Actions */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h3 className="font-medium text-gray-900">Template Management</h3>
            <p className="text-sm text-gray-600">
              {systemTemplates.length} template{systemTemplates.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="flex space-x-2">
            {systemTemplates.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAllTemplates}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>
        </div>

        {/* Selected Template Display */}
        {selectedTemplate && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800">Selected Template</h4>
                <p className="text-sm text-green-700">{selectedTemplate.name}</p>
                <p className="text-xs text-green-600">{selectedTemplate.category}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        )}

        {/* Templates List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : systemTemplates.length === 0 ? (
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              No system templates available. Upload your first template to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {systemTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      {selectedTemplate?.id === template.id && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>File: {template.file_name}</span>
                      <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                      <span>Size: {(template.file_data.length / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadTemplate(template);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateUploadManager;