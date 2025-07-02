
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TemplateService } from "@/services/templateService";
import { DatabaseTemplate } from "@/types/database";
import LiveTemplateEditor from "./LiveTemplateEditor";
import { 
  FileText, 
  Edit, 
  Trash2, 
  Search,
  FolderOpen,
  Calendar
} from "lucide-react";

const TemplateStorage = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DatabaseTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DatabaseTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DatabaseTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchTerm, templates]);

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

  const filterTemplates = () => {
    if (!searchTerm) {
      setFilteredTemplates(templates);
      return;
    }

    const filtered = templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredTemplates(filtered);
  };

  const handleEditTemplate = (template: DatabaseTemplate) => {
    setSelectedTemplate(template);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await TemplateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template Deleted",
        description: "Template has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete template",
        variant: "destructive"
      });
    }
  };

  const handleTemplateSaved = (updatedTemplate: DatabaseTemplate) => {
    setTemplates(prev => 
      prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
    );
    setSelectedTemplate(null);
  };

  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading stored templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5" />
            <span>Stored Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

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
                          {template.variables.length} variables
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Modified: {new Date(template.updated_at).toLocaleDateString()}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>

                  {/* Content Preview */}
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3 max-h-16 overflow-hidden">
                    {template.content.substring(0, 100)}...
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
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

          {filteredTemplates.length === 0 && !loading && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "No templates found matching your search." : "No templates stored yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Template Editor Modal */}
      {selectedTemplate && (
        <LiveTemplateEditor
          template={{
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            content: selectedTemplate.content,
            variables: selectedTemplate.variables
          }}
          onClose={() => setSelectedTemplate(null)}
          onSave={handleTemplateSaved}
        />
      )}
    </div>
  );
};

export default TemplateStorage;
