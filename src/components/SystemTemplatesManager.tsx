
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SystemTemplateService, SystemTemplate, CreateSystemTemplateData } from "@/services/systemTemplateService";
import { TemplateCategory } from "@/types/database";
import { 
  FolderOpen, 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  Plus,
  X,
  CheckCircle
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
      const data = await SystemTemplateService.getAllSystemTemplates();
      setTemplates(data);
    } catch (error) {
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

    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a Word document (.docx or .doc)",
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
    if (!uploadForm.file || !uploadForm.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and select a file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileData = new Uint8Array(await uploadForm.file.arrayBuffer());
      
      const templateData: CreateSystemTemplateData = {
        name: uploadForm.name,
        description: uploadForm.description,
        category: uploadForm.category,
        file_name: uploadForm.file.name,
        file_data: fileData,
        content_type: uploadForm.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      await SystemTemplateService.uploadSystemTemplate(templateData);
      
      toast({
        title: "Template Uploaded",
        description: "System template has been uploaded successfully",
      });

      setUploadForm({
        name: '',
        description: '',
        category: 'agreements',
        file: null
      });
      setShowUploadForm(false);
      loadSystemTemplates();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload the template",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this system template?")) return;

    try {
      await SystemTemplateService.deleteSystemTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template Deleted",
        description: "System template has been removed",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the template",
        variant: "destructive"
      });
    }
  };

  const handleSelectTemplate = async (template: SystemTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
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
          {/* Upload Form */}
          {showUploadForm && !showSelectMode && (
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg">Upload New System Template</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-category">Category</Label>
                    <Select value={uploadForm.category} onValueChange={(value: TemplateCategory) => setUploadForm(prev => ({ ...prev, category: value }))}>
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
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="system-file-upload" className="cursor-pointer">
                        Choose Word Document
                      </label>
                    </Button>
                    {uploadForm.file && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-sm text-green-700 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Selected: {uploadForm.file.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowUploadForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUploadTemplate}
                    disabled={uploading || !uploadForm.file || !uploadForm.name}
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

                  <div className="flex items-center space-x-2">
                    {showSelectMode ? (
                      <Button
                        size="sm"
                        onClick={() => handleSelectTemplate(template)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Select Template
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const blob = new Blob([template.file_data], { type: template.content_type });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = template.file_name;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                    {!showSelectMode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemTemplatesManager;
