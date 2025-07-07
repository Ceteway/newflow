import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SystemTemplateService, CreateSystemTemplateData } from "@/services/systemTemplateService";
import { TemplateCategory } from "@/types/database";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Folder, 
  FolderOpen,
  X,
  Loader2,
  FileUp,
  FilePlus2,
  FileCheck,
  Zap
} from "lucide-react";

interface AdvancedTemplateImporterProps {
  onClose: () => void;
  onTemplateImported: () => void;
}

const AdvancedTemplateImporter = ({ onClose, onTemplateImported }: AdvancedTemplateImporterProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    total: number;
    errors: string[];
  }>({ success: 0, failed: 0, total: 0, errors: [] });

  // Single file upload state
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleFileForm, setSingleFileForm] = useState({
    name: '',
    description: '',
    category: 'agreements' as TemplateCategory
  });

  // Batch upload state
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchCategory, setBatchCategory] = useState<TemplateCategory>('agreements');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const handleSingleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isValidTemplateFile(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a Word document (.docx or .doc) or PDF file",
        variant: "destructive"
      });
      return;
    }

    setSingleFile(file);
    // Auto-populate name from filename (without extension)
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setSingleFileForm(prev => ({
      ...prev,
      name: fileName
    }));
  };

  const handleBatchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isValidTemplateFile(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    }

    if (invalidFiles.length > 0) {
      toast({
        title: `${invalidFiles.length} Invalid Files Skipped`,
        description: `Only Word documents (.docx, .doc) and PDFs are supported`,
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      setBatchFiles(prev => [...prev, ...validFiles]);
      toast({
        title: `${validFiles.length} Files Added`,
        description: `Added ${validFiles.length} files to the batch upload queue`
      });
    }

    // Reset the input to allow selecting the same files again
    if (batchInputRef.current) {
      batchInputRef.current.value = '';
    }
  };

  const isValidTemplateFile = (file: File): boolean => {
    return (
      file.name.endsWith('.docx') || 
      file.name.endsWith('.doc') || 
      file.name.endsWith('.pdf')
    );
  };

  const handleRemoveBatchFile = (index: number) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSingleUpload = async () => {
    if (!singleFile || !singleFileForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a file and template name",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);

      // Convert file to Uint8Array
      const arrayBuffer = await singleFile.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      const templateData: CreateSystemTemplateData = {
        name: singleFileForm.name.trim(),
        description: singleFileForm.description.trim() || undefined,
        category: singleFileForm.category,
        file_name: singleFile.name,
        file_data: fileData,
        content_type: singleFile.type || getContentTypeFromExtension(singleFile.name)
      };

      const result = await SystemTemplateService.uploadSystemTemplate(templateData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "Upload Successful",
        description: `Template "${singleFileForm.name}" has been uploaded successfully`,
      });

      // Reset form
      setSingleFile(null);
      setSingleFileForm({
        name: '',
        description: '',
        category: 'agreements'
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onTemplateImported();
      
      // Close after a short delay to show 100% progress
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Could not upload the template",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults({
      success: 0,
      failed: 0,
      total: batchFiles.length,
      errors: []
    });
    
    try {
      const totalFiles = batchFiles.length;
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        
        try {
          // Update progress
          setUploadProgress(Math.round((i / totalFiles) * 100));
          
          // Convert file to Uint8Array
          const arrayBuffer = await file.arrayBuffer();
          const fileData = new Uint8Array(arrayBuffer);
          
          const templateData: CreateSystemTemplateData = {
            name: fileName,
            description: `Imported from batch upload on ${new Date().toLocaleDateString()}`,
            category: batchCategory,
            file_name: file.name,
            file_data: fileData,
            content_type: file.type || getContentTypeFromExtension(file.name)
          };

          await SystemTemplateService.uploadSystemTemplate(templateData);
          successCount++;
          
          setUploadResults(prev => ({
            ...prev,
            success: prev.success + 1
          }));
          
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push(`${file.name}: ${errorMessage}`);
          
          setUploadResults(prev => ({
            ...prev,
            failed: prev.failed + 1,
            errors: [...prev.errors, `${file.name}: ${errorMessage}`]
          }));
        }
      }

      setUploadProgress(100);
      
      if (successCount === totalFiles) {
        toast({
          title: "Batch Upload Complete",
          description: `Successfully uploaded all ${successCount} templates`,
        });
      } else {
        toast({
          title: "Batch Upload Completed with Issues",
          description: `Uploaded ${successCount} of ${totalFiles} templates. ${failedCount} failed.`,
          variant: failedCount > successCount ? "destructive" : "default"
        });
      }

      // Reset batch files
      setBatchFiles([]);
      
      onTemplateImported();
      
    } catch (error) {
      toast({
        title: "Batch Upload Failed",
        description: error instanceof Error ? error.message : "Could not complete the batch upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getContentTypeFromExtension = (filename: string): string => {
    if (filename.endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (filename.endsWith('.doc')) {
      return 'application/msword';
    } else if (filename.endsWith('.pdf')) {
      return 'application/pdf';
    }
    return 'application/octet-stream';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileUp className="w-5 h-5" />
              <span>Advanced Template Importer</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isUploading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          <Tabs defaultValue="single" value={activeTab} onValueChange={(value) => setActiveTab(value as 'single' | 'batch')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" disabled={isUploading}>
                <FilePlus2 className="w-4 h-4 mr-2" />
                Single Template
              </TabsTrigger>
              <TabsTrigger value="batch" disabled={isUploading}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Batch Import
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4 pt-4">
              {/* Single File Upload */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template File</Label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center ${singleFile ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
                    {singleFile ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="font-medium text-green-700">{singleFile.name}</p>
                        <p className="text-sm text-green-600">
                          {(singleFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSingleFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Drag and drop your template file here</p>
                        <p className="text-sm text-gray-500 mb-4">or</p>
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          onChange={handleSingleFileChange}
                          className="hidden"
                          ref={fileInputRef}
                          disabled={isUploading}
                        />
                        <Button variant="outline" asChild disabled={isUploading}>
                          <label htmlFor="file-upload" className="cursor-pointer">
                            Browse Files
                          </label>
                        </Button>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".doc,.docx,.pdf"
                          onChange={handleSingleFileChange}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={singleFileForm.name}
                      onChange={(e) => setSingleFileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                      disabled={isUploading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-category">Category</Label>
                    <Select 
                      value={singleFileForm.category} 
                      onValueChange={(value: TemplateCategory) => setSingleFileForm(prev => ({ ...prev, category: value }))}
                      disabled={isUploading}
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
                    value={singleFileForm.description}
                    onChange={(e) => setSingleFileForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the template"
                    disabled={isUploading}
                  />
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSingleUpload}
                    disabled={isUploading || !singleFile || !singleFileForm.name.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileUp className="w-4 h-4 mr-2" />
                        Upload Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4 pt-4">
              {/* Batch File Upload */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Template Files</Label>
                    <Badge variant="outline">
                      {batchFiles.length} files selected
                    </Badge>
                  </div>
                  
                  <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-300">
                    <Folder className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Drag and drop multiple template files here</p>
                    <p className="text-sm text-gray-500 mb-4">or</p>
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      multiple
                      onChange={handleBatchFileChange}
                      className="hidden"
                      ref={batchInputRef}
                      disabled={isUploading}
                    />
                    <Button variant="outline" asChild disabled={isUploading}>
                      <label htmlFor="batch-file-upload" className="cursor-pointer">
                        Select Multiple Files
                      </label>
                    </Button>
                    <input
                      id="batch-file-upload"
                      type="file"
                      accept=".doc,.docx,.pdf"
                      multiple
                      onChange={handleBatchFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {batchFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files</Label>
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {batchFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveBatchFile(index)}
                            disabled={isUploading}
                            className="h-6 w-6 p-0 text-gray-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="batch-category">Category for All Files</Label>
                  <Select 
                    value={batchCategory} 
                    onValueChange={(value: TemplateCategory) => setBatchCategory(value)}
                    disabled={isUploading}
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
                  <p className="text-xs text-gray-500">
                    All files will be uploaded with this category. File names will be used as template names.
                  </p>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading batch...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Success: {uploadResults.success}/{uploadResults.total}</span>
                      <span>Failed: {uploadResults.failed}/{uploadResults.total}</span>
                    </div>
                  </div>
                )}

                {uploadResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label>Upload Errors</Label>
                    <div className="border rounded-lg bg-red-50 p-2 max-h-32 overflow-y-auto">
                      {uploadResults.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 py-1 border-b border-red-100 last:border-b-0">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBatchUpload}
                    disabled={isUploading || batchFiles.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading Batch...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Upload {batchFiles.length} Templates
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
            <p>✓ Supported formats: Word documents (.docx, .doc) and PDF files</p>
            <p>✓ Maximum file size: 10MB per template</p>
            <p>✓ Templates will be available to all users of the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedTemplateImporter;