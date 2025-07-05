import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useROF5Form } from "@/hooks/useROF5Form";
import { useWorkflow, WorkflowInstruction } from "@/contexts/WorkflowContext";
import { DocumentGenerationService, GeneratedDocument, DocumentGenerationOptions } from "@/services/documentGenerationService";
import { ROF5DocumentService, ROF5Document } from "@/services/rof5DocumentService";
import { DraftService, SavedDraft } from "@/services/draftService";
import { AIService } from "@/services/aiService";
import FormHeader from "@/components/ROF5/FormHeader";
import FormSections from "@/components/ROF5/FormSections";
import FormActions from "@/components/ROF5/FormActions";
import AISuggestions from "@/components/AISuggestions";
import SystemTemplatesManager from "@/components/SystemTemplatesManager";
import { SystemTemplate } from "@/services/systemTemplateService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileText, Save, FolderOpen, Download } from "lucide-react";

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
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
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

  const handleSelectTemplate = (template: SystemTemplate) => {
    setSelectedTemplate(template);
    setDocumentOptions(prev => ({
      ...prev,
      agreementType: template.name.toLowerCase()
    }));
    setShowTemplateSelector(false);
    
    toast({
      title: "Template Selected",
      description: `${template.name} will be used for document generation`,
    });
  };

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
        description: "Please wait while we generate your documents...",
      });

      const documents = await DocumentGenerationService.generateDocumentsFromROF5(
        formData,
        documentOptions
      );

      setGeneratedDocuments(documents);

      toast({
        title: "Documents Generated Successfully",
        description: `Generated ${documents.length} documents. Click download to save them.`,
      });

    } catch (error) {
      console.error('Document generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate documents. Please check your templates and try again.",
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
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Document Generation</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={documentOptions.includeAgreement}
                        onChange={(e) => setDocumentOptions(prev => ({
                          ...prev,
                          includeAgreement: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span>Generate Agreement Document</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={documentOptions.includeForwardingLetter}
                        onChange={(e) => setDocumentOptions(prev => ({
                          ...prev,
                          includeForwardingLetter: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span>Generate Forwarding Letter</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={documentOptions.includeInvoice}
                        onChange={(e) => setDocumentOptions(prev => ({
                          ...prev,
                          includeInvoice: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span>Generate Invoice</span>
                    </label>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowTemplateSelector(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Select Template
                    </button>
                    
                    {selectedTemplate && (
                      <div className="p-3 bg-green-100 rounded">
                        <p className="text-sm text-green-800">
                          Template: <strong>{selectedTemplate.name}</strong>
                        </p>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleGenerateDocuments}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Generating..." : "Generate Documents"}
                    </button>
                  </div>
                </div>

                {generatedDocuments.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Generated Documents ({generatedDocuments.length})</h4>
                    <div className="space-y-2">
                      {generatedDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm">{doc.name}</span>
                          <button
                            type="button"
                            onClick={() => DocumentGenerationService.downloadDocument(doc)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleDownloadAll}
                        className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Download All Documents
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <FormActions 
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
            />
          </form>
        </CardContent>
      </Card>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <SystemTemplatesManager
          showSelectMode={true}
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
};

export default ROF5Form;
