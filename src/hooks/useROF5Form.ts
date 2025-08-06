import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useWorkflow, WorkflowInstruction } from "@/contexts/WorkflowContext";
import { DocumentGenerator, DocumentVariable } from "@/services/documentGenerator";

export interface ROF5FormData {
  // Site Details
  siteName: string;
  siteCode: string;
  siteLocation: string;
  
  // Title Details
  titleNumber: string;
  titleType: string;
  landArea: string;
  landUse: string;
  
  // Landlord Information
  landlordName: string;
  landlordType: string;
  landlordAddress: string;
  landlordPhone: string;
  landlordEmail: string;
  landlordId: string;
  
  // Lease Terms
  leaseType: string;
  leaseTerm: string;
  commencementDate: string;
  monthlyRent: string;
  deposit: string;
  rentEscalation: string;
  
  // Additional Terms
  permitType: string;
  specialConditions: string;
  
  // Internal Details
  instructingCounsel: string;
  urgencyLevel: string;
  expectedCompletionDate: string;
}

const initialFormData: ROF5FormData = {
  siteName: "",
  siteCode: "",
  siteLocation: "",
  county: "",
  subCounty: "",
  ward: "",
  titleNumber: "",
  titleType: "",
  registrationSection: "",
  landArea: "",
  landUse: "",
  landlordName: "",
  landlordType: "",
  landlordAddress: "",
  landlordPhone: "",
  landlordEmail: "",
  landlordId: "",
  leaseType: "",
  leaseTerm: "",
  commencementDate: "",
  monthlyRent: "",
  deposit: "",
  rentEscalation: "5",
  permitType: "",
  specialConditions: "",
  documentsReceived: [],
  instructingCounsel: "",
  urgencyLevel: "",
  expectedCompletionDate: ""
};

export const useROF5Form = () => {
  const { toast } = useToast();
  const { addInstruction, generateDocuments } = useWorkflow();
  const [formData, setFormData] = useState<ROF5FormData>(initialFormData);

  const handleInputChange = (field: keyof ROF5FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadFormData = (newFormData: ROF5FormData) => {
    setFormData(newFormData);
  };

  const generateDocumentVariables = (): DocumentVariable[] => {
    return [
      { key: 'current_date', value: new Date().toLocaleDateString() },
      { key: 'site_name', value: formData.siteName },
      { key: 'site_code', value: formData.siteCode },
      { key: 'site_location', value: formData.siteLocation },
      { key: 'landlord_name', value: formData.landlordName },
      { key: 'landlord_address', value: formData.landlordAddress },
      { key: 'title_number', value: formData.titleNumber },
      { key: 'land_area', value: formData.landArea },
      { key: 'commencement_date', value: formData.commencementDate },
      { key: 'lease_term', value: formData.leaseTerm },
      { key: 'monthly_rent', value: formData.monthlyRent },
      { key: 'escalation_rate', value: formData.rentEscalation },
      { key: 'deposit', value: formData.deposit },
      { key: 'lease_type', value: formData.leaseType },
      { key: 'file_ref', value: `${formData.siteCode}/2024` }
    ];
  };

  const submitForm = () => {
    // Validate required fields
    if (!formData.siteName || !formData.siteCode || !formData.siteLocation || !formData.landlordName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Site Name, Site Code, Location, and Landlord Name)",
        variant: "destructive"
      });
      return;
    }

    // Create new instruction
    const newInstruction: WorkflowInstruction = {
      id: `ROF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      siteCode: formData.siteCode,
      siteName: formData.siteName,
      siteLocation: formData.siteLocation,
      landlordName: formData.landlordName,
      stage: 'document-drafting',
      progress: 15,
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      assignee: formData.instructingCounsel || 'Unassigned',
      nextAction: 'Document Preparation Required',
      priority: formData.urgencyLevel === 'urgent' ? 'high' : formData.urgencyLevel === 'normal' ? 'medium' : 'low',
      formData: formData,
      generatedDocuments: [],
      auditTrail: [{
        id: `audit-${Date.now()}`,
        action: 'Instruction Created',
        user: 'Current User',
        timestamp: new Date().toISOString(),
        details: `ROF 5 form submitted for ${formData.siteName} - ${formData.siteCode}`
      }]
    };

    addInstruction(newInstruction);

    toast({
      title: "Instruction Created",
      description: `New property instruction ${newInstruction.id} has been created successfully.`,
    });

    resetForm();
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const validateFormData = (): boolean => {
    const requiredFields = ['siteName', 'siteCode', 'siteLocation', 'landlordName'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof ROF5FormData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  return {
    formData,
    handleInputChange,
    generateDocumentVariables,
    submitForm,
    resetForm,
    validateFormData,
    loadFormData,
    addInstruction,
    generateDocuments,
    toast
  };
};
