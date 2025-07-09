
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Edit, 
  Search,
  Plus,
  Eye,
  FolderOpen,
  Save,
  X,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TemplateService } from "@/services/templateService";
import { DatabaseTemplate, TemplateCategory } from "@/types/database";
import TemplateCreator from "./TemplateCreator";
import TemplateStorage from "./TemplateStorage";
import TemplateVariableEditor from "./TemplateVariableEditor";

const DocumentTemplates = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DatabaseTemplate | null>(null);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DatabaseTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    content: '',
    variables: [] as string[]
  });
  const [templates, setTemplates] = useState<DatabaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const categories: Array<TemplateCategory | "All"> = ["All", "agreements", "forms", "letters", "invoices", "reports"];
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "All">("All");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await TemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === "All" || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePreviewTemplate = (template: DatabaseTemplate) => {
    toast({
      title: "Template Preview",
      description: template.content.substring(0, 100) + "...",
    });
  };

  const handleOpenEditor = (template: DatabaseTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || '',
      content: template.content,
      variables: template.variables
    });
    setPreviewContent('');
    setShowTemplateEditor(true);
  };

  const handleCloseEditor = () => {
    setShowTemplateEditor(false);
    setEditingTemplate(null);
    setPreviewContent('');
  };

  const handleGeneratePreview = async () => {
    if (!editForm.content) return;
    
    setIsGeneratingPreview(true);
    try {
      // Extract variables from content
      const extractedVariables = TemplateService.extractVariablesFromContent(editForm.content);
      
      // Create dummy variables with placeholder values
      const dummyVariables = extractedVariables.map(key => ({
        key,
        value: `[${key.replace(/_/g, ' ')}]`
      }));
      
      // Generate preview using the template service
      const filledContent = TemplateService.fillTemplate(editForm.content, dummyVariables);
      setPreviewContent(filledContent);
      
      toast({
        title: "Preview Generated",
        description: "Template preview has been generated with placeholder values",
      });
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Could not generate template preview",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      // Extract variables from content
      const extractedVariables = TemplateService.extractVariablesFromContent(editForm.content);
      
      const updatedTemplate = await TemplateService.updateTemplate(editingTemplate.id, {
        name: editForm.name,
        description: editForm.description,
        content: editForm.content,
        variables: extractedVariables
      });
      
      // Update the template in the local state
      setTemplates(prev => 
        prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
      );
      
      toast({
        title: "Template Updated",
        description: "The template has been updated successfully",
      });
      
      handleCloseEditor();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update the template",
        variant: "destructive"
      });
    }
  };

  const handleGenerateDocument = (template: DatabaseTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCloseVariableEditor = () => {
    setSelectedTemplate(null);
  };

  const handleShowTemplateCreator = () => {
    setShowTemplateCreator(true);
  };

  const handleCloseTemplateCreator = () => {
    setShowTemplateCreator(false);
  };

  const handleTemplateCreated = () => {
    loadTemplates(); // Refresh the templates list
  };

  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library">Template Library</TabsTrigger>
          <TabsTrigger value="storage">My Templates</TabsTrigger> 
        </TabsList>
        
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Document Templates</span>
                </CardTitle>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleShowTemplateCreator}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(category)}
                    >
                      {getCategoryDisplayName(category)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryDisplayName(template.category)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {template.variables.length} variables
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>Modified: {new Date(template.updated_at).toLocaleDateString()}</span>
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewTemplate(template)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditor(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateDocument(template)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No templates found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Variables Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Template Variables Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="common" className="w-full">
                <TabsList>
                  <TabsTrigger value="common">Common Variables</TabsTrigger>
                  <TabsTrigger value="site">Site Variables</TabsTrigger>
                  <TabsTrigger value="lease">Lease Variables</TabsTrigger>
                  <TabsTrigger value="parties">Party Variables</TabsTrigger>
                </TabsList>
                
                <TabsContent value="common" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Date Variables</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{current_date}}"}</code> - Current date</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{commencement_date}}"}</code> - Lease commencement</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{expiry_date}}"}</code> - Lease expiry</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Document Variables</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{document_ref}}"}</code> - Document reference</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{instruction_ref}}"}</code> - Instruction reference</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{file_ref}}"}</code> - File reference</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="site" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Site Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{site_code}}"}</code> - Site code</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{site_location}}"}</code> - Site location</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{county}}"}</code> - County</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{sub_county}}"}</code> - Sub-county</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Title Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{title_number}}"}</code> - Title number</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{title_type}}"}</code> - Title type</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{land_area}}"}</code> - Land area</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="lease" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Financial Terms</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{monthly_rent}}"}</code> - Monthly rent</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{annual_rent}}"}</code> - Annual rent</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{deposit}}"}</code> - Security deposit</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{escalation_rate}}"}</code> - Escalation rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Lease Terms</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{lease_term}}"}</code> - Lease term</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{lease_type}}"}</code> - Lease type</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{renewal_option}}"}</code> - Renewal option</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="parties" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Landlord Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{landlord_name}}"}</code> - Landlord name</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{landlord_address}}"}</code> - Landlord address</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{landlord_id}}"}</code> - Landlord ID</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Safaricom Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{tenant_name}}"}</code> - Safaricom PLC</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{tenant_address}}"}</code> - Safaricom address</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{poa_name}}"}</code> - POA name</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <TemplateStorage />
        </TabsContent>
      </Tabs>
      
      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* Editor Panel */}
              <div className="p-4 border-b lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Edit Template</h2>
                  <Button variant="ghost" size="sm" onClick={handleCloseEditor}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template Name</label>
                    <Input 
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input 
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter template description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Template Content</label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGeneratePreview}
                        disabled={isGeneratingPreview}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingPreview ? 'animate-spin' : ''}`} />
                        Generate Preview
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use double curly braces for variables: {`{{variable_name}}`}
                    </p>
                    <Textarea 
                      value={editForm.content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter template content"
                      className="font-mono text-sm min-h-[300px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Variables</label>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm">
                        Current variables: {editingTemplate.variables.length > 0 
                          ? editingTemplate.variables.map(v => `{{${v}}}`).join(', ') 
                          : 'None'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Variables will be automatically extracted when you save the template.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handleCloseEditor}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Template
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Preview Panel */}
              <div className="p-4 bg-gray-50">
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <div className="bg-white border rounded-md p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                  {previewContent ? (
                    <div className="whitespace-pre-wrap font-serif text-sm">
                      {previewContent}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>Click "Generate Preview" to see how your template will look</p>
                      <p className="text-xs mt-2">Variables will be shown as placeholders</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
  FileText, 
  Download, 
  Edit, 
  Search,
  Plus,
  Eye,
  FolderOpen,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TemplateService } from "@/services/templateService";
import { DatabaseTemplate, TemplateCategory } from "@/types/database";
import TemplateCreator from "./TemplateCreator";
import TemplateStorage from "./TemplateStorage";
import TemplateVariableEditor from "./TemplateVariableEditor";

const DocumentTemplates = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DatabaseTemplate | null>(null);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DatabaseTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    content: '',
    variables: [] as string[]
  });
  const [templates, setTemplates] = useState<DatabaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const categories: Array<TemplateCategory | "All"> = ["All", "agreements", "forms", "letters", "invoices", "reports"];
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "All">("All");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await TemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === "All" || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePreviewTemplate = (template: DatabaseTemplate) => {
    toast({
      title: "Template Preview",
      description: template.content.substring(0, 100) + "...",
    });
  };

  const handleOpenEditor = (template: DatabaseTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || '',
      content: template.content,
      variables: template.variables
    });
    setShowTemplateEditor(true);
  };

  const handleCloseEditor = () => {
    setShowTemplateEditor(false);
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      // Extract variables from content
      const extractedVariables = TemplateService.extractVariablesFromContent(editForm.content);
      
      const updatedTemplate = await TemplateService.updateTemplate(editingTemplate.id, {
        name: editForm.name,
        description: editForm.description,
        content: editForm.content,
        variables: extractedVariables
      });
      
      // Update the template in the local state
      setTemplates(prev => 
        prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
      );
      
      toast({
        title: "Template Updated",
        description: "The template has been updated successfully",
      });
      
      handleCloseEditor();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update the template",
        variant: "destructive"
      });
    }
  };

  const handleGenerateDocument = (template: DatabaseTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCloseVariableEditor = () => {
    setSelectedTemplate(null);
  };

  const handleShowTemplateCreator = () => {
    setShowTemplateCreator(true);
  };

  const handleCloseTemplateCreator = () => {
    setShowTemplateCreator(false);
  };

  const handleTemplateCreated = () => {
    loadTemplates(); // Refresh the templates list
  };

  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library">Template Library</TabsTrigger>
          <TabsTrigger value="storage">My Templates</TabsTrigger> 
        </TabsList>
        
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Document Templates</span>
                </CardTitle>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleShowTemplateCreator}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(category)}
                    >
                      {getCategoryDisplayName(category)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryDisplayName(template.category)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {template.variables.length} variables
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>Modified: {new Date(template.updated_at).toLocaleDateString()}</span>
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewTemplate(template)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditor(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateDocument(template)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No templates found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Variables Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Template Variables Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="common" className="w-full">
                <TabsList>
                  <TabsTrigger value="common">Common Variables</TabsTrigger>
                  <TabsTrigger value="site">Site Variables</TabsTrigger>
                  <TabsTrigger value="lease">Lease Variables</TabsTrigger>
                  <TabsTrigger value="parties">Party Variables</TabsTrigger>
                </TabsList>
                
                <TabsContent value="common" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Date Variables</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{current_date}}"}</code> - Current date</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{commencement_date}}"}</code> - Lease commencement</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{expiry_date}}"}</code> - Lease expiry</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Document Variables</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{document_ref}}"}</code> - Document reference</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{instruction_ref}}"}</code> - Instruction reference</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{file_ref}}"}</code> - File reference</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="site" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Site Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{site_code}}"}</code> - Site code</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{site_location}}"}</code> - Site location</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{county}}"}</code> - County</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{sub_county}}"}</code> - Sub-county</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Title Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{title_number}}"}</code> - Title number</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{title_type}}"}</code> - Title type</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{land_area}}"}</code> - Land area</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="lease" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Financial Terms</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{monthly_rent}}"}</code> - Monthly rent</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{annual_rent}}"}</code> - Annual rent</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{deposit}}"}</code> - Security deposit</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{escalation_rate}}"}</code> - Escalation rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Lease Terms</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{lease_term}}"}</code> - Lease term</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{lease_type}}"}</code> - Lease type</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{renewal_option}}"}</code> - Renewal option</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="parties" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Landlord Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{landlord_name}}"}</code> - Landlord name</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{landlord_address}}"}</code> - Landlord address</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{landlord_id}}"}</code> - Landlord ID</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Safaricom Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{tenant_name}}"}</code> - Safaricom PLC</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{tenant_address}}"}</code> - Safaricom address</p>
                        <p><code className="bg-gray-100 px-2 py-1 rounded">{"{{poa_name}}"}</code> - POA name</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <TemplateStorage />
        </TabsContent>
      </Tabs>
      
      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Template</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseEditor}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input 
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input 
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Content</label>
                <p className="text-xs text-gray-500">
                  Use double curly braces for variables: {`{{variable_name}}`}
                </p>
                <Textarea 
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter template content"
                  className="font-mono text-sm min-h-[300px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Variables</label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">
                    Current variables: {editingTemplate.variables.length > 0 
                      ? editingTemplate.variables.map(v => `{{${v}}}`).join(', ') 
                      : 'None'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Variables will be automatically extracted when you save the template.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCloseEditor}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Variable Editor Modal */}
      {selectedTemplate && (
        <TemplateVariableEditor
          template={{
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            content: selectedTemplate.content,
            variables: selectedTemplate.variables
          }}
          onClose={handleCloseVariableEditor}
        />
      )}

      {/* Template Creator Modal */}
      {showTemplateCreator && (
        <TemplateCreator
          onClose={handleCloseTemplateCreator}
          onTemplateCreated={handleTemplateCreated}
        />
      )}
    </div>
  );
};

export default DocumentTemplates;
