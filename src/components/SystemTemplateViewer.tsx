
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SystemTemplateService, SystemTemplate } from "@/services/systemTemplateService";
import { TemplateCategory } from "@/types/database";
import { 
  FileText, 
  Download, 
  Edit, 
  Save,
  X,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface SystemTemplateViewerProps {
  template: SystemTemplate;
  onClose: () => void;
  onUpdate: () => void;
}

const SystemTemplateViewer = ({ template, onClose, onUpdate }: SystemTemplateViewerProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");
  
  const [editForm, setEditForm] = useState({
    name: template.name,
    description: template.description || '',
    category: template.category,
    file: null as File | null
  });

  useEffect(() => {
    extractTemplateText();
  }, [template]);

  const extractTemplateText = async () => {
    try {
      setExtracting(true);
      setExtractionError('');
      console.log('Starting text extraction for template:', template.id);
      
      try {
        const text = await SystemTemplateService.extractTextFromTemplate(template);
        setExtractedText(text);
        console.log('Text extraction successful, length:', text.length);
      } catch (extractError) {
        console.warn('Text extraction failed, using fallback:', extractError);
        // Use a fallback message instead of showing an error
        setExtractedText(
          `[Template: ${template.name}]\n\n` +
          `This is a preview of the template. The actual document may contain formatting ` +
          `that cannot be displayed here.\n\n` +
          `File: ${template.file_name}\n` +
          `Type: ${template.content_type}\n` +
          `Size: ${(template.file_data.length / 1024).toFixed(2)} KB\n\n` +
          `You can download this template to view its full contents.`
        );
      }
    } catch (error) {
      console.error('Failed to extract text:', error);
      const errorMessage = error instanceof Error ? error.message : "Could not extract text from the template";
      setExtractionError(errorMessage);
      toast({
        title: "Preview Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleRetryExtraction = () => {
    extractTemplateText();
  };

  const handleDownload = () => {
    try {
      SystemTemplateService.downloadTemplate(template);
      
      // Only show toast if download appears successful
      if (template.file_data && template.file_data.length > 0) {
        toast({
          title: "Download Started",
          description: `Downloading ${template.file_name}`,
        });
      } else {
        throw new Error('Template has no file data');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Could not download the template",
        variant: "destructive"
      });
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

    setEditForm(prev => ({ ...prev, file }));
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a template name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        category: editForm.category
      };

      if (editForm.file) {
        const arrayBuffer = await editForm.file.arrayBuffer();
        updates.file_data = new Uint8Array(arrayBuffer);
        updates.file_name = editForm.file.name;
        updates.content_type = editForm.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      await SystemTemplateService.updateSystemTemplate(template.id, updates);
      
      toast({
        title: "Template Updated",
        description: "System template has been updated successfully",
      });

      setIsEditing(false);
      onUpdate();
      
      // Re-extract text if file was updated
      if (editForm.file) {
        await extractTemplateText();
      }
      
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Could not update the template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>{template.name}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Template Name *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select 
                    value={editForm.category} 
                    onValueChange={(value: TemplateCategory) => setEditForm(prev => ({ ...prev, category: value }))}
                    disabled={loading}
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
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the template"
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Replace Template File (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="edit-file-upload"
                    disabled={loading}
                  />
                  <Button variant="outline" asChild disabled={loading}>
                    <label htmlFor="edit-file-upload" className="cursor-pointer">
                      Choose New Word Document
                    </label>
                  </Button>
                  {editForm.file && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <p className="text-sm text-green-700">
                        Selected: {editForm.file.name} ({(editForm.file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <p className="text-sm">{getCategoryDisplayName(template.category)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">File Name</Label>
                  <p className="text-sm">{template.file_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Uploaded</Label>
                  <p className="text-sm">{new Date(template.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{new Date(template.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {template.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-sm">{template.description}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-500">Template Preview</Label>
                  {extractionError && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryExtraction}
                        disabled={extracting}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Preview
                      </Button>
                    </>
                  )}
                </div>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    {extracting ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span>Extracting text from template...</span>
                      </div>
                    ) : extractionError ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <AlertCircle className="w-6 h-6 mb-2 text-red-500" />
                        <span className="text-red-600 mb-2">Could not extract text preview</span>
                        <p className="text-sm text-gray-500 text-center">
                          You can still download the template to view its contents manually
                        </p>
                      </div>
                    ) : extractedText ? (
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
                        {extractedText}
                        {extractedText.includes('[Template:') && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs">
                            <p className="font-medium">Note: This is a limited preview.</p>
                            <p>The actual template content will be available when you use this template to generate documents.</p>
                          </div>
                        )}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-gray-500">
                        <Eye className="w-6 h-6 mr-2" />
                        <span>No preview available</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemTemplateViewer;
