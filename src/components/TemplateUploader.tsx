import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SystemTemplateService } from "@/services/systemTemplateService";
import { TemplateCategory } from "@/types/database";
import { 
  Upload, 
  X,
  CheckCircle,
  Loader2,
  FileText
} from "lucide-react";

interface TemplateUploaderProps {
  onClose: () => void;
  onTemplateUploaded: (destination: 'user' | 'fanisi') => void;
}

const TemplateUploader = ({ onClose, onTemplateUploaded }: TemplateUploaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadDestination, setUploadDestination] = useState<'user' | 'fanisi'>('user');
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'agreements' as TemplateCategory,
    file: null as File | null
  });

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
      if (uploadDestination === 'fanisi') {
        // Upload to Fanisi Templates (Supabase)
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
      } else {
        // Upload to User Templates (localStorage)
        // Read the file as text
        const text = await uploadForm.file.text();
        
        // Create a new template object
        const newTemplate = {
          id: `template_${Date.now()}`,
          name: uploadForm.name,
          description: uploadForm.description,
          category: uploadForm.category,
          content: text,
          variables: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Get existing templates from localStorage
        const existingTemplatesJson = localStorage.getItem('documentTemplates');
        const existingTemplates = existingTemplatesJson ? JSON.parse(existingTemplatesJson) : [];
        
        // Add new template and save back to localStorage
        const updatedTemplates = [...existingTemplates, newTemplate];
        localStorage.setItem('documentTemplates', JSON.stringify(updatedTemplates));
      }
      
      toast({
        title: "Upload Successful",
        description: `Template "${uploadForm.name}" has been uploaded to ${uploadDestination === 'user' ? 'User Templates' : 'Fanisi Templates'}`,
      });

      // Reset form
      setUploadForm({
        name: '',
        description: '',
        category: 'agreements',
        file: null
      });
      
      // Reset file input
      const fileInput = document.getElementById('template-file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Notify parent component
      onTemplateUploaded(uploadDestination);
      onClose();
      
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload Template</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Destination Selector */}
          <div className="space-y-2">
            <Label>Upload Destination</Label>
            <Tabs 
              defaultValue="user" 
              value={uploadDestination} 
              onValueChange={(value) => setUploadDestination(value as 'user' | 'fanisi')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user">User Templates</TabsTrigger>
                <TabsTrigger value="fanisi">Fanisi Templates</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-gray-500">
              {uploadDestination === 'user' 
                ? 'User templates are stored locally in your browser and are only accessible to you.' 
                : 'Fanisi templates are stored in the cloud and are accessible to all users.'}
            </p>
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
            <Label>Template File *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {uploadForm.file ? (
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                  <p className="font-medium text-green-700">{uploadForm.file.name}</p>
                  <p className="text-sm text-green-600">
                    {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setUploadForm(prev => ({ ...prev, file: null }));
                      const fileInput = document.getElementById('template-file-upload') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Drag and drop your template file here</p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <input
                    type="file"
                    accept=".doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="template-file-upload"
                    disabled={uploading}
                  />
                  <Button variant="outline" asChild disabled={uploading}>
                    <label htmlFor="template-file-upload" className="cursor-pointer">
                      Browse Files
                    </label>
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: Word documents (.docx, .doc) • Maximum file size: 10MB
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
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
                  Upload to {uploadDestination === 'user' ? 'User Templates' : 'Fanisi Templates'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateUploader;