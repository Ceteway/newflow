import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useROF5Form } from "@/hooks/useROF5Form";
import { useWorkflow, WorkflowInstruction } from "@/contexts/WorkflowContext";
import { DocumentGenerationService, GeneratedDocument, DocumentGenerationOptions } from "@/services/documentGenerationService";
import { ROF5DocumentService, ROF5Document } from "@/services/rof5DocumentService";
import { DraftService, SavedDraft } from "@/services/draftService";
import { AIService } from "@/services/aiService";
import { DocumentGenerator } from "@/services/documentGenerator";
import FormHeader from "@/components/ROF5/FormHeader";
import FormSections from "@/components/ROF5/FormSections";
import FormActions from "@/components/ROF5/FormActions";
import AISuggestions from "@/components/AISuggestions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileText, Save, FolderOpen, Download, Eye } from "lucide-react";
import { SystemTemplateService, SystemTemplate } from "@/services/systemTemplateService";
import { formatTemplateContent, isContentReadable } from "@/utils/templates/documentUtils";
import FanisiDocumentGeneratorComponent from "@/components/FanisiDocumentGenerator";
import EnhancedTemplateSelector from "@/components/EnhancedTemplateSelector";
import { FanisiGeneratedDocument } from "@/types/fanisi";

const ROF5Form = () => {
  const {
    formData,
    handleInputChange,
    handleDocumentCheck,
    generateDocumentVariables,
    resetForm,
    addInstruction,
    toast,
    loadFormData
  } = useROF5Form();

  const [currentField, setCurrentField] = useState<string>('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [documentOptions, setDocumentOptions] = useState<DocumentGenerationOptions>({
    includeAgreement: true,
    includeForwardingLetter: true,
    includeInvoice: true
  });

  // Draft management state
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);

  const [selectedAgreementTemplate, setSelectedAgreementTemplate] = useState<SystemTemplate | null>(null);
  const [systemTemplates, setSystemTemplates] = useState<SystemTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // Template preview state
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [templatePreviewContent, setTemplatePreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Fanisi document generator state
  const [showFanisiGenerator, setShowFanisiGenerator] = useState(false);
  const [fanisiDocuments, setFanisiDocuments] = useState<FanisiGeneratedDocument[]>([]);

  const handleInputChangeWithAI = (field: keyof typeof formData, value: string) => {
    handleInputChange(field, value);
    if (aiEnabled) {
      setCurrentField(field);
    }
  };

  const handleApplyAISuggestion = (field: string, value: string) => {
    handleInputChange(field as keyof typeof formData, value);
    toast({
      title: "AI Suggestion Applied",
      description: `${field} updated with AI suggestion`,
    });
  };

  const handleSaveDraft = () => {
    if (draftName.trim()) {
      try {
        const draft = DraftService.saveDraft(formData, draftName);
        setSavedDrafts(DraftService.getAllDrafts());
        setShowDraftDialog(false);
        setDraftName('');
        toast({
          title: "Draft Saved",
          description: `ROF 5 draft "${draft.name}" has been saved successfully`,
        });
      } catch (error) {
        toast({
          title: "Save Failed",
          description: "Failed to save draft. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // Quick save with auto-generated name
      try {
        const draft = DraftService.saveDraft(formData);
        setSavedDrafts(DraftService.getAllDrafts());
        toast({
          title: "Draft Saved",
          description: `ROF 5 draft "${draft.name}" has been saved successfully`,
        });
      } catch (error) {
        toast({
          title: "Save Failed",
          description: "Failed to save draft. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    loadFormData(draft.formData);
    setShowLoadDialog(false);
    toast({
      title: "Draft Loaded",
      description: `Loaded draft: ${draft.name}`,
    });
  };

  const handleDeleteDraft = (draftId: string) => {
    DraftService.deleteDraft(draftId);
    setSavedDrafts(DraftService.getAllDrafts());
    toast({
      title: "Draft Deleted",
      description: "Draft has been deleted successfully",
    });
  };

  const handleDownloadROF5 = async () => {
    try {
      setIsSubmitting(true);
      toast({
        title: "Generating ROF5 Document",
        description: "Please wait while we generate your ROF5 form in Word format...",
      });

      const rof5Document = await ROF5DocumentService.generateROF5Document(formData);
      ROF5DocumentService.downloadROF5Document(rof5Document);

      toast({
        title: "ROF5 Downloaded",
        description: "ROF5 form has been downloaded successfully",
      });
    } catch (error) {
      console.error('ROF5 download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate ROF5 document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTemplate = (templateName: string) => {
    // Find the template object from the loaded system templates
    const template = systemTemplates.find(t => t.name === templateName);
    
    if (template) {
      setSelectedAgreementTemplate(template);
      setSelectedTemplate(templateName);
      setDocumentOptions(prev => ({
        ...prev, 
        agreementType: templateName.toLowerCase()
      }));
    }
    
    setShowTemplateSelector(false);
    
    toast({
      title: "Template Selected",
      description: `${templateName} will be used for document generation`,
    });
  };

  // Watch for leaseType changes and select matching template
  useEffect(() => {
    const selectTemplateByLeaseType = async () => {
      if (!formData.leaseType) {
        setSelectedAgreementTemplate(null);
        return;
      }
      const systemTemplates = await SystemTemplateService.getAllSystemTemplates();
      const match = systemTemplates.find(t => t.name.toLowerCase() === formData.leaseType.toLowerCase());
      setSelectedAgreementTemplate(match || null);
    };
    selectTemplateByLeaseType();
  }, [formData.leaseType]);

  const handleGenerateDocuments = async () => {
    if (!formData.siteName || !formData.siteCode || !formData.landlordName) {
      toast({
        title: "Missing Information",
        description: "Please fill in site name, site code, and landlord name before generating documents",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      toast({
        title: "Generating Documents",
        description: "Converting template and filling blank spaces with ROF5 data...",
      });

      // Use the selected template for agreement if available
      const documentOptionsWithTemplate = {
        ...documentOptions,
        agreementType: selectedAgreementTemplate ? selectedAgreementTemplate.name : formData.leaseType
      };

      const documents = await DocumentGenerationService.generateDocumentsFromROF5(
        formData,
        documentOptionsWithTemplate
      );

      setGeneratedDocuments(documents);

      toast({
        title: "Documents Generated Successfully",
        description: `Generated ${documents.length} documents with blank spaces filled from ROF5 data. Click download to save them.`,
      });
    } catch (error) {
      console.error('Document generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate documents. Please check your templates and ROF5 data, then try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadAll = () => {
    if (generatedDocuments.length === 0) {
      toast({
        title: "No Documents",
        description: "Please generate documents first before downloading",
        variant: "destructive"
      });
      return;
    }

    DocumentGenerationService.downloadAllDocuments(generatedDocuments);
    
    toast({
      title: "Download Started",
      description: `Downloading ${generatedDocuments.length} documents...`,
    });
  };

  const handleFanisiDocumentGenerated = (document: FanisiGeneratedDocument) => {
    setFanisiDocuments(prev => [...prev, document]);
    toast({
      title: "Fanisi Document Generated",
      description: `${document.fileName} has been generated successfully`,
    });
  };

  const handleDocumentGenerated = (document: { name: string; content: Uint8Array }) => {
    const generatedDoc = {
      id: `doc_${Date.now()}`,
      name: document.name,
      content: document.content,
      format: 'docx',
      templateUsed: 'system-template'
    };
    
    setGeneratedDocuments(prev => [...prev, generatedDoc]);
    
    toast({
      title: "Document Generated",
      description: `${document.name} has been generated and downloaded`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.siteName || !formData.siteCode || !formData.siteLocation || !formData.landlordName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Site Name, Site Code, Location, and Landlord Name)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use AI to calculate smart priority and deadline
      const aiPriority = AIService.calculateSmartPriority(formData);
      const aiDeadline = AIService.calculateSmartDeadline(formData, aiPriority);
      
      // Create new instruction with AI enhancements
      const instructionId = `ROF-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
      
      const newInstruction: WorkflowInstruction = {
        id: instructionId,
        siteCode: formData.siteCode,
        siteName: formData.siteName,
        siteLocation: formData.siteLocation,
        landlordName: formData.landlordName,
        stage: 'document-drafting',
        progress: 25,
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        assignee: formData.instructingCounsel || 'Unassigned',
        nextAction: 'Generate Documents',
        priority: aiPriority,
        formData: { ...formData, expectedCompletionDate: aiDeadline },
        generatedDocuments: generatedDocuments.map(doc => doc.name),
        auditTrail: [{
          id: `audit-${Date.now()}`,
          action: 'ROF 5 Submitted with Document Generation',
          user: formData.instructingCounsel || 'Current User',
          timestamp: new Date().toISOString(),
          details: `Priority: ${aiPriority}, Deadline: ${aiDeadline}, Documents: ${generatedDocuments.length}`
        }]
      };

      addInstruction(newInstruction);
      
      toast({
        title: "ROF 5 Submitted Successfully",
        description: `Property instruction ${instructionId} created with ${generatedDocuments.length} generated documents.`,
      });

      // Auto-generate documents if none exist yet
      if (generatedDocuments.length === 0) {
        await handleGenerateDocuments();
      }

      // Reset form
      resetForm();
      setGeneratedDocuments([]);

    } catch (error) {
      console.error('ROF5 submission error:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit ROF 5 form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load drafts on component mount
  useState(() => {
    setSavedDrafts(DraftService.getAllDrafts());
  });

  // Load system templates on component mount
  useEffect(() => {
    const loadSystemTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const templates = await SystemTemplateService.getAllSystemTemplates();
        setSystemTemplates(templates);
        console.log(`Loaded ${templates.length} system templates`);
      } catch (error) {
        console.error('Error loading system templates:', error);
        toast({
          title: "Template Loading Failed",
          description: "Failed to load system templates. Template selector may not work properly.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadSystemTemplates();
  }, [toast]);

  // Load template preview content when a template is selected
  useEffect(() => {
    const loadTemplatePreview = async () => {
      if (selectedAgreementTemplate) {
        setIsLoadingPreview(true);
        try {
          console.log('Loading preview for template:', selectedAgreementTemplate.name);
          const content = await SystemTemplateService.extractTextFromTemplate(selectedAgreementTemplate);
          
          if (isContentReadable(content)) {
            const formattedContent = formatTemplateContent(content);
            setTemplatePreviewContent(formattedContent);
          } else {
            setTemplatePreviewContent(`
              <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <h3 style="margin-bottom: 1rem;">Template Preview Not Available</h3>
                <p>This template cannot be previewed in the browser, but it can still be used for document generation.</p>
                <p style="margin-top: 1rem;"><strong>Template:</strong> ${selectedAgreementTemplate.name}</p>
                <p><strong>File:</strong> ${selectedAgreementTemplate.file_name}</p>
              </div>
            `);
          }
        } catch (error) {
          console.error('Error loading template preview:', error);
          setTemplatePreviewContent(`
            <div style="text-align: center; padding: 2rem; color: #ef4444;">
              <h3 style="margin-bottom: 1rem;">Preview Error</h3>
              <p>Unable to load template preview.</p>
              <p style="margin-top: 1rem;"><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          `);
        } finally {
          setIsLoadingPreview(false);
        }
      } else {
        setTemplatePreviewContent('');
      }
    };

    loadTemplatePreview();
  }, [selectedAgreementTemplate]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <FormHeader 
          aiEnabled={aiEnabled} 
          onToggleAI={() => setAiEnabled(!aiEnabled)} 
        />
        <CardContent>
          {/* Draft Management Bar */}
          <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex space-x-2">
              <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Draft</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter draft name (optional)"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowDraftDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveDraft}>
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Load Draft
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Load Draft</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {savedDrafts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No saved drafts found</p>
                    ) : (
                      savedDrafts.map((draft) => (
                        <div key={draft.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <h4 className="font-medium">{draft.name}</h4>
                            <p className="text-sm text-gray-500">
                              Saved: {new Date(draft.savedAt).toLocaleDateString()}{' '}
                              {new Date(draft.savedAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleLoadDraft(draft)}>
                              Load
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteDraft(draft.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Button onClick={handleDownloadROF5} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Download ROF5 (Word)
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FormSections
                formData={formData}
                onInputChange={handleInputChangeWithAI}
                onDocumentCheck={handleDocumentCheck}
              />

              {aiEnabled && (
                <div className="space-y-4">
                  <AISuggestions
                    formData={formData}
                    currentField={currentField}
                    onApplySuggestion={handleApplyAISuggestion}
                  />
                </div>
              )}
            </div>

            {/* Document Generation Section */}
            <EnhancedTemplateSelector
              rof5Data={formData}
              onDocumentGenerated={handleDocumentGenerated}
            />

            {/* Fanisi Legal Document Generator */}
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-800">Fanisi Legal Document Generator</h3>
                  <Button
                    type="button"
                    onClick={() => setShowFanisiGenerator(!showFanisiGenerator)}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    {showFanisiGenerator ? 'Hide' : 'Show'} Fanisi Generator
                  </Button>
                </div>
                
                {showFanisiGenerator && (
                  <FanisiDocumentGeneratorComponent
                    rof5Data={formData}
                    onDocumentGenerated={handleFanisiDocumentGenerated}
                  />
                )}
                
                {fanisiDocuments.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-3">Generated Fanisi Documents ({fanisiDocuments.length})</h4>
                    <div className="space-y-2">
                      {fanisiDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="text-sm font-medium">{doc.fileName}</span>
                            <p className="text-xs text-gray-500">{doc.documentType} - {doc.siteName}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              const blob = new Blob([doc.content], {
                                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                              });
                              link.href = URL.createObjectURL(blob);
                              link.download = doc.fileName;
                              link.click();
                              URL.revokeObjectURL(link.href);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <FormActions 
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
              onDownloadROF5={handleDownloadROF5}
            />
          </form>
        </CardContent>
      </Card>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Agreement Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoadingTemplates ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            ) : systemTemplates.filter(t => t.category === 'agreements').length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No agreement templates available</p>
                <p className="text-sm text-gray-500 mt-2">Upload some agreement templates to use this feature</p>
              </div>
            ) : (
              systemTemplates
                .filter(t => t.category === 'agreements')
                .map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>File: {template.file_name}</span>
                        <span>Category: {template.category}</span>
                        <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectTemplate(template.name)}
                      className="ml-4"
                      variant={selectedAgreementTemplate?.id === template.id ? "default" : "outline"}
                    >
                      {selectedAgreementTemplate?.id === template.id ? "Selected" : "Select"}
                    </Button>
                  </div>
                ))
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowTemplateSelector(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ROF5Form;