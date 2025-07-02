
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useROF5Form } from "@/hooks/useROF5Form";
import { useWorkflow, WorkflowInstruction } from "@/contexts/WorkflowContext";
import { DocumentGenerator } from "@/services/documentGenerator";
import { AIService } from "@/services/aiService";
import FormHeader from "@/components/ROF5/FormHeader";
import FormSections from "@/components/ROF5/FormSections";
import FormActions from "@/components/ROF5/FormActions";
import AISuggestions from "@/components/AISuggestions";

const ROF5Form = () => {
  const {
    formData,
    handleInputChange,
    handleDocumentCheck,
    generateDocumentVariables,
    resetForm,
    addInstruction,
    generateDocuments,
    toast
  } = useROF5Form();

  const [currentField, setCurrentField] = useState<string>('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    toast({
      title: "Draft Saved",
      description: "ROF 5 form has been saved as draft",
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
        generatedDocuments: [],
        auditTrail: [{
          id: `audit-${Date.now()}`,
          action: 'ROF 5 Submitted with AI Enhancement',
          user: formData.instructingCounsel || 'Current User',
          timestamp: new Date().toISOString(),
          details: `Priority: ${aiPriority}, Deadline: ${aiDeadline}`
        }]
      };

      addInstruction(newInstruction);

      // Generate initial documents based on lease type
      const templateIds = [formData.leaseType || 'lease-agreement'];
      
      await generateDocuments(instructionId, templateIds);
      
      // Generate and download the main document
      const variables = generateDocumentVariables();
      const content = DocumentGenerator.populateTemplate(templateIds[0], variables);
      DocumentGenerator.downloadDocument(content, `${formData.siteCode}-${templateIds[0]}.txt`);
      
      toast({
        title: "ROF 5 Submitted Successfully",
        description: `Property instruction ${instructionId} created with AI-enhanced priority (${aiPriority}) and smart deadline.`,
      });

      // Reset form
      resetForm();

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <FormHeader 
          aiEnabled={aiEnabled} 
          onToggleAI={() => setAiEnabled(!aiEnabled)} 
        />
        <CardContent>
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

            <FormActions 
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ROF5Form;
