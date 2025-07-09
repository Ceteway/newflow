import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Plus, Edit, Trash2, FileText, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import SystemTemplatesManager from './SystemTemplatesManager';
import TemplateStorage from './TemplateStorage';
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
  const [activeTab, setActiveTab] = useState('user');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);

  useEffect(() => {
    // Load templates from localStorage or API
    const savedTemplates = localStorage.getItem('documentTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Document Templates</h2>

      <Tabs defaultValue="user" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user">User Templates</TabsTrigger>
          <TabsTrigger value="fanisi">Fanisi Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user" className="mt-6">
          <TemplateStorage />
        </TabsContent>
        
        <TabsContent value="fanisi" className="mt-6">
          <SystemTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentTemplates;