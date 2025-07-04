
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Edit, 
  Search,
  Plus,
  Eye,
  FolderOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TemplateService } from "@/services/templateService";
import { DatabaseTemplate, TemplateCategory } from "@/types/database";
import TemplateVariableEditor from "./TemplateVariableEditor";
import TemplateCreator from "./TemplateCreator";
import TemplateStorage from "./TemplateStorage";
import SystemTemplatesManager from "./SystemTemplatesManager";

const DocumentTemplates = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DatabaseTemplate | null>(null);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
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

  const handleEditTemplate = (template: DatabaseTemplate) => {
    toast({
      title: "Template Editor",
      description: "Template editing functionality coming soon",
    });
  };

  const handleGenerateDocument = (template: DatabaseTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCloseEditor = () => {
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
          <TabsTrigger value="system">System Templates</TabsTrigger>
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
                          onClick={() => handleEditTemplate(template)}
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

        <TabsContent value="system">
          <SystemTemplatesManager />
        </TabsContent>
      </Tabs>

      {/* Template Variable Editor Modal */}
      {selectedTemplate && (
        <TemplateVariableEditor
          template={{
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            content: selectedTemplate.content,
            variables: selectedTemplate.variables
          }}
          onClose={handleCloseEditor}
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
