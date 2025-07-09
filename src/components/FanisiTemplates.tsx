import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SystemTemplateService, SystemTemplate } from "@/services/systemTemplateService";
import { TemplateCategory } from "@/types/database";
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
  Loader2,
  Search
} from "lucide-react";

const FanisiTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'agreements' as TemplateCategory,
    file: null as File | null
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await SystemTemplateService.getAllSystemTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
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
      // Convert file to Uint8Array
      const arrayBuffer = await uploadForm.file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      const templateData = {
        name: uploadForm.name.trim(),
        description: uploadForm.description.trim() || undefined,
        category: uploadForm.category,
        file_name: uploadForm.file.name,
        file_data: fileData,
        content_type: uploadForm.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      await SystemTemplateService.uploadSystemTemplate(templateData);
      
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
      const fileInput = document.getElementById('fanisi-file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      setShowUploadForm(false);
      await loadTemplates(); // Reload templates
      
    } catch (error) {
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
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
      await SystemTemplateService.deleteSystemTemplate(templateId);
      
      // Remove the template from the local state
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template Deleted",
        description: "Template has been removed",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Could not delete the template",
        variant: "destructive"
      });
    }
  };

  const handleViewTemplate = async (template: SystemTemplate) => {
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

  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const filteredTemplates = templates.filter(template => {
    // Filter by search term
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fanisi Templates</h2>
          <p className="text-gray-600">Manage and organize your Fanisi document templates</p>
        </div>
        <Button onClick={() => setShowUploadForm(!showUploadForm)} className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {showUploadForm ? "Cancel Upload" : "Upload Template"}
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50 mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Upload New Template</h3>
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
                  id="fanisi-file-upload"
                  disabled={uploading}
                />
                <Button variant="outline" asChild disabled={uploading}>
                  <label htmlFor="fanisi-file-upload" className="cursor-pointer">
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
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Template
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="agreements">Agreements</SelectItem>
            <SelectItem value="forms">Forms</SelectItem>
            <SelectItem value="letters">Letters</SelectItem>
            <SelectItem value="invoices">Invoices</SelectItem>
            <SelectItem value="reports">Reports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Old Search Bar - Replaced with the above */}
      {/* <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div> */}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
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
                  Fanisi
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewTemplate(template)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadTemplate(template)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {searchTerm ? "No templates found matching your search." : "No templates found."}
          </p>
          {!searchTerm && (
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

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{selectedTemplate.name}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadTemplate(selectedTemplate)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <p className="text-sm">{getCategoryDisplayName(selectedTemplate.category)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">File Name</Label>
                  <p className="text-sm">{selectedTemplate.file_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Uploaded</Label>
                  <p className="text-sm">{new Date(selectedTemplate.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedTemplate.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedTemplate.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-sm">{selectedTemplate.description}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-500">Template Preview</Label>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mr-3" />
                      <div className="text-center">
                        <p className="text-gray-700 font-medium mb-2">{selectedTemplate.file_name}</p>
                        <p className="text-sm text-gray-500">
                          Download this template to view its contents
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => handleDownloadTemplate(selectedTemplate)}
                          className="mt-3"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FanisiTemplates;