import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Plus, Edit, Trash2, FileText, Download, FileUp } from 'lucide-react';
import TemplateCreator from './TemplateCreator';
import TemplateVariableEditor from './TemplateVariableEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import FanisiTemplates from './FanisiTemplates';

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

const DocumentTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);

  useEffect(() => {
    // Load templates from localStorage or API
    const savedTemplates = localStorage.getItem('documentTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('documentTemplates', JSON.stringify(updatedTemplates));
  };

  const handleCloseVariableEditor = () => {
    setSelectedTemplate(null);
  };

  const handleCloseTemplateCreator = () => {
    setShowTemplateCreator(false);
  };

  const handleTemplateCreated = (newTemplate: Template) => {
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('documentTemplates', JSON.stringify(updatedTemplates));
    setShowTemplateCreator(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="user-templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user-templates" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            User Templates
          </TabsTrigger>
          <TabsTrigger value="fanisi-templates" className="flex items-center">
            <FileUp className="w-4 h-4 mr-2" />
            Fanisi Templates
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="user-templates" className="mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Templates</h2>
              <p className="text-gray-600">Manage and organize your custom document templates</p>
            </div>
            <Button onClick={() => setShowTemplateCreator(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {template.category && (
                    <Badge variant="secondary" className="w-fit">
                      {template.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {template.content.substring(0, 100)}...
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{template.variables.length} variables</span>
                    <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first template to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowTemplateCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="fanisi-templates" className="mt-6">
          <FanisiTemplates />
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