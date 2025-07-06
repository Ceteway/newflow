import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { SystemTemplateService, SystemTemplate, CreateSystemTemplateData } from "@/services/systemTemplateService";
import { TemplateCategory } from "@/types/database";
import SystemTemplateViewer from "./SystemTemplateViewer";
import { 
  FolderOpen, 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  Plus,
  X,
  CheckCircle,
  Eye,
  Loader2
} from "lucide-react";

interface SystemTemplatesManagerProps {
  onSelectTemplate?: (template: SystemTemplate) => void;
  showSelectMode?: boolean;
  onClose?: () => void;
}

const SystemTemplatesManager = ({ 
  onSelectTemplate, 
  showSelectMode = false, 
  onClose 
}: SystemTemplatesManagerProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'agreements' as TemplateCategory,
    file: null as File | null
  });

  useEffect(() => {
    loadSystemTemplates();
  }, []);

  const loadSystemTemplates = async () => {
    try {
      setLoading(true);
      console.log('Loading system templates...');
      const data = await SystemTemplateService.getAllSystemTemplates();
      console.log('System templates loaded:', data.length);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load system templates:', error);
      toast({
        title: "Error",
        description: "Failed to load system templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a Word document (.docx or .doc)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadForm(prev => ({
      ...prev,
      file,
      name: prev.name || file.name.replace(/\.[^/.]+$/, "")
    }));
  };

  const handleUploadTemplate = async () => {
    if (!uploadForm.file || !uploadForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and select a file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      console.log('Starting upload process...');
      
      // Convert file to Uint8Array
      const arrayBuffer = await uploadForm.file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      console.log('File processed:', {
        name: uploadForm.name,
        fileName: uploadForm.file.name,
        size: fileData.length,
        type: uploadForm.file.type
      });
      
      const templateData: CreateSystemTemplateData = {
        name: uploadForm.name.trim(),
        description: uploadForm.description.trim() || undefined,
        category: uploadForm.category,
        file_name: uploadForm.file.name,
        file_data: fileData,
        content_type: uploadForm.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      const result = await SystemTemplateService.uploadSystemTemplate(templateData);
      console.log('Upload successful:', result.id);
      
      toast({
        title: "Upload Successful",
        description: `Template "${uploadForm.name}" has been uploaded successfully`,
      });

      // Reset form
      setUploadForm({
        name: '',
        description: '',
        category: 'agreements',
        file: null
      });
      
      // Reset file input
      const fileInput = document.getElementById('system-file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      setShowUploadForm(false);
      await loadSystemTemplates(); // Reload templates
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Could not upload the template",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setDeletingId(templateId);
      console.log('Deleting system template:', templateId);
      
      await SystemTemplateService.deleteSystemTemplate(templateId);
      
      // Remove the template from the local state
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template Deleted",
        description: "System template has been removed",
      });
      
      console.log('Template deleted successfully:', templateId);
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Could not delete the template",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewTemplate = (template: SystemTemplate) => {
    setSelectedTemplate(template);
  };

  const handleDownloadTemplate = (template: SystemTemplate) => {
    try {
      SystemTemplateService.downloadTemplate(template);
      toast({
        title: "Download Started",
        description: `Downloading ${template.file_name}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the template",
        variant: "destructive"
      });
    }
  };

  const handleSelectTemplate = async (template: SystemTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const handleTemplateUpdated = () => {
    loadSystemTemplates();
    setSelectedTemplate(null);
  };

  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading system templates...</div>
      </div>
    );
  }

  return (
    <div className={showSelectMode ? "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" : ""}>
      <Card className={showSelectMode ? "w-full max-w-6xl max-h-[90vh] overflow-hidden" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5" />
              <span>System Templates</span>
              <Badge variant="secondary">{templates.length}</Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {!showSelectMode && (
                <Button 
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Template
                </Button>
              )}
              {showSelectMode && onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Form - keep existing code */}
          {showUploadForm && !showSelectMode && (
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Upload New System Template</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowUploadForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                      disabled={uploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-category">Category</Label>
                    <Select 
                      value={uploadForm.category} 
                      onValueChange={(value: TemplateCategory) => setUploadForm(prev => ({ ...prev, category: value }))}
                      disabled={uploading}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the template"
                    disabled={uploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Word Document File *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="system-file-upload"
                      disabled={uploading}
                    />
                    <Button variant="outline" asChild disabled={uploading}>
                      <label htmlFor="system-file-upload" className="cursor-pointer">
                        Choose Word Document
                      </label>
                    </Button>
                    {uploadForm.file && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-sm text-green-700 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUploadForm(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUploadTemplate}
                    disabled={uploading || !uploadForm.file || !uploadForm.name.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? "Uploading..." : "Upload Template"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {template.description || "No description"}
                      </p>
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryDisplayName(template.category)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {template.file_name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Uploaded: {new Date(template.created_at).toLocaleDateString()}</span>
                    <Badge className="bg-green-100 text-green-800">
                      System
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-1">
                    {showSelectMode ? (
                      <Button
                        size="sm"
                        onClick={() => handleSelectTemplate(template)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Select
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewTemplate(template)}
                          className="flex-1"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadTemplate(template)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deletingId === template.id}
                            >
                              {deletingId === template.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete System Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{template.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No system templates found</p>
              <p className="text-sm text-gray-500">Upload Word document templates to make them available to all users</p>
              {!showUploadForm && !showSelectMode && (
                <Button 
                  onClick={() => setShowUploadForm(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First Template
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Viewer Modal */}
      {selectedTemplate && (
        <SystemTemplateViewer
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUpdate={handleTemplateUpdated}
        />
      )}
    </div>
  );
};

export default SystemTemplatesManager;
