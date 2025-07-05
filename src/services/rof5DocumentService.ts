
import { DocumentGeneratorService } from "./documentGeneratorService";
import { ROF5FormData } from "@/hooks/useROF5Form";
import { DocumentVariable } from "@/types/database";

export interface ROF5Document {
  id: string;
  name: string;
  content: Uint8Array;
  format: string;
}

export class ROF5DocumentService {
  static async generateROF5Document(formData: ROF5FormData): Promise<ROF5Document> {
    console.log('Generating ROF5 document in Word format...');
    
    const variables = this.extractROF5Variables(formData);
    const templateContent = this.generateROF5Template();
    
    const result = await DocumentGeneratorService.generateDocument(
      templateContent,
      variables,
      { format: 'docx', includeFormatting: true }
    );

    return {
      id: `rof5_${Date.now()}`,
      name: `ROF5_${formData.siteCode}_${formData.siteName || 'Form'}.docx`,
      content: result.content as Uint8Array,
      format: 'docx'
    };
  }

  private static extractROF5Variables(formData: ROF5FormData): DocumentVariable[] {
    const currentDate = new Date();
    return [
      // Header information
      { key: 'form_title', value: 'PROPERTY INSTRUCTION FORM (ROF 5)' },
      { key: 'current_date', value: currentDate.toLocaleDateString() },
      { key: 'form_ref', value: `ROF5-${formData.siteCode || 'NEW'}-${currentDate.getFullYear()}` },
      
      // Site Information
      { key: 'site_name', value: formData.siteName || '[Site Name]' },
      { key: 'site_code', value: formData.siteCode || '[Site Code]' },
      { key: 'site_location', value: formData.siteLocation || '[Site Location]' },
      { key: 'county', value: formData.county || '[County]' },
      { key: 'sub_county', value: formData.subCounty || '[Sub County]' },
      { key: 'ward', value: formData.ward || '[Ward]' },
      
      // Title Details
      { key: 'title_number', value: formData.titleNumber || '[Title Number]' },
      { key: 'title_type', value: formData.titleType || '[Title Type]' },
      { key: 'registration_section', value: formData.registrationSection || '[Registration Section]' },
      { key: 'land_area', value: formData.landArea || '[Land Area]' },
      { key: 'land_use', value: formData.landUse || '[Land Use]' },
      
      // Landlord Information
      { key: 'landlord_name', value: formData.landlordName || '[Landlord Name]' },
      { key: 'landlord_type', value: formData.landlordType || '[Landlord Type]' },
      { key: 'landlord_address', value: formData.landlordAddress || '[Landlord Address]' },
      { key: 'landlord_phone', value: formData.landlordPhone || '[Phone]' },
      { key: 'landlord_email', value: formData.landlordEmail || '[Email]' },
      { key: 'landlord_id', value: formData.landlordId || '[ID Number]' },
      
      // Lease Terms
      { key: 'lease_type', value: formData.leaseType || '[Lease Type]' },
      { key: 'lease_term', value: formData.leaseTerm || '[Lease Term]' },
      { key: 'commencement_date', value: formData.commencementDate || '[Commencement Date]' },
      { key: 'monthly_rent', value: formData.monthlyRent || '[Monthly Rent]' },
      { key: 'deposit', value: formData.deposit || '[Deposit Amount]' },
      { key: 'rent_escalation', value: formData.rentEscalation || '5%' },
      
      // Additional Information
      { key: 'permit_type', value: formData.permitType || '[Permit Type]' },
      { key: 'special_conditions', value: formData.specialConditions || '[Special Conditions]' },
      { key: 'documents_received', value: formData.documentsReceived?.join(', ') || '[Documents Received]' },
      { key: 'instructing_counsel', value: formData.instructingCounsel || '[Instructing Counsel]' },
      { key: 'urgency_level', value: formData.urgencyLevel || '[Urgency Level]' },
      { key: 'expected_completion', value: formData.expectedCompletionDate || '[Expected Completion]' }
    ];
  }

  private static generateROF5Template(): string {
    return `
PROPERTY INSTRUCTION FORM (ROF 5)

Form Reference: {{form_ref}}
Date: {{current_date}}

SECTION A: SITE INFORMATION
═══════════════════════════════════════════════════════════════════

Site Name: {{site_name}}
Site Code: {{site_code}}
Site Location: {{site_location}}
County: {{county}}
Sub County: {{sub_county}}
Ward: {{ward}}

SECTION B: TITLE DETAILS
═══════════════════════════════════════════════════════════════════

Title Number: {{title_number}}
Title Type: {{title_type}}
Registration Section: {{registration_section}}
Land Area: {{land_area}}
Land Use: {{land_use}}

SECTION C: LANDLORD INFORMATION
═══════════════════════════════════════════════════════════════════

Name: {{landlord_name}}
Type: {{landlord_type}}
Address: {{landlord_address}}
Phone: {{landlord_phone}}
Email: {{landlord_email}}
ID Number: {{landlord_id}}

SECTION D: LEASE TERMS
═══════════════════════════════════════════════════════════════════

Lease Type: {{lease_type}}
Lease Term: {{lease_term}}
Commencement Date: {{commencement_date}}
Monthly Rent: {{monthly_rent}}
Deposit: {{deposit}}
Rent Escalation: {{rent_escalation}}

SECTION E: ADDITIONAL INFORMATION
═══════════════════════════════════════════════════════════════════

Permit Type: {{permit_type}}
Special Conditions: {{special_conditions}}
Documents Received: {{documents_received}}

SECTION F: INTERNAL PROCESSING
═══════════════════════════════════════════════════════════════════

Instructing Counsel: {{instructing_counsel}}
Urgency Level: {{urgency_level}}
Expected Completion: {{expected_completion}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SAFARICOM PLC - LEGAL DEPARTMENT
Property Instruction Form (ROF 5)

Form completed on: {{current_date}}
    `.trim();
  }

  static downloadROF5Document(document: ROF5Document): void {
    const blob = new Blob([document.content], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const url = URL.createObjectURL(blob);
    const link = globalThis.document.createElement('a');
    link.href = url;
    link.download = document.name;
    globalThis.document.body.appendChild(link);
    link.click();
    globalThis.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
