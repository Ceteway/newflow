
import { DocumentGeneratorService } from "./documentGeneratorService";
import { SystemTemplateService, SystemTemplate } from "./systemTemplateService";
import { DocumentVariable } from "@/types/database";
import { ROF5FormData } from "@/hooks/useROF5Form";
import { DocumentGenerator } from "./documentGenerator";
import { detectAndConvertBlankSpaces } from "@/utils/templates/documentParser";
import { detectExistingBlankSpaces, fillBlankSpace } from "@/utils/templates/blankSpaceManager";

export interface GeneratedDocument {
  id: string;
  name: string;
  content: Uint8Array;
  format: string;
  templateUsed: string;
}

export interface DocumentGenerationOptions {
  includeAgreement: boolean;
  includeForwardingLetter: boolean;
  includeInvoice: boolean;
  agreementType?: string;
}

/**
 * Fills blank spaces in HTML content with ROF5 data in a fixed order
 * @param htmlContent HTML content with blank spaces
 * @param formData ROF5 form data
 * @returns Plain text content with blanks filled
 */
function fillBlanksWithROF5Data(htmlContent: string, formData: ROF5FormData): string {
  console.log('Filling blanks with ROF5 data in fixed order...');
  
  // Convert any dot patterns to blank space spans
  let processedContent = detectAndConvertBlankSpaces(htmlContent);
  
  // Define the fixed order of ROF5 fields as specified
  const rof5FieldsInOrder = [
    formData.landlordName || '[Landlord Name]',                    // 1. Landlord
    formData.siteCode || '[Property Reference]',                   // 2. Property reference number
    formatDateString(new Date()),                                  // 3. This ....day of .....20.....
    formData.landlordAddress || '[Landlord Address]',              // 4. Address
    formData.commencementDate || '[Commencement Date]',            // 5. Commencement date (First Schedule)
    formData.siteLocation || '[Site Location]',                    // 6. Land, all land known as... (First Schedule)
    formData.landlordAddress || '[Landlord Postal Address]',       // 7. The landlord postal address (First Schedule)
    `${formData.leaseTerm || '[Lease Term]'} years`,              // 8. Period of years (Term)
    `${formData.leaseTerm || '[Lease Term]'} years`               // 9. Consecutive term of years (Term)
  ];
  
  console.log('ROF5 fields in order:', rof5FieldsInOrder);
  
  // Detect existing blank spaces in the processed content
  const blankSpaces = detectExistingBlankSpaces(processedContent);
  console.log(`Found ${blankSpaces.length} blank spaces to fill`);
  
  // Fill each blank space with the corresponding ROF5 field value
  let filledContent = processedContent;
  blankSpaces.forEach((blankSpace, index) => {
    if (index < rof5FieldsInOrder.length) {
      const fieldValue = rof5FieldsInOrder[index];
      console.log(`Filling blank space ${index + 1} (${blankSpace.id}) with: ${fieldValue}`);
      filledContent = fillBlankSpace(filledContent, blankSpace.id, fieldValue);
    } else {
      console.warn(`No ROF5 field defined for blank space ${index + 1}, leaving unfilled`);
    }
  });
  
  // Convert HTML to plain text for DOCX generation
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = filledContent;
  
  // Extract text content from the HTML
  let plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up the text
  plainText = plainText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  console.log(`Filled content converted to plain text, length: ${plainText.length}`);
  return plainText;
}

/**
 * Formats a date as "This [ordinal] day of [month] [year]"
 * @param date Date to format
 * @returns Formatted date string
 */
function formatDateString(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  // Get ordinal suffix for day
  const getOrdinalSuffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };
  
  return `This ${day}${getOrdinalSuffix(day)} day of ${month} ${year}`;
}

export class DocumentGenerationService {
  static async generateDocumentsFromROF5(
    formData: ROF5FormData,
    options: DocumentGenerationOptions = {
      includeAgreement: true,
      includeForwardingLetter: true,
      includeInvoice: true
    }
  ): Promise<GeneratedDocument[]> {
    console.log('Starting document generation from ROF 5 data...');
    
    const generatedDocuments: GeneratedDocument[] = [];
    const variables = this.extractVariablesFromROF5(formData);
    
    try {
      // Get all system templates
      console.log('Fetching system templates for document generation...');
      const systemTemplates = await SystemTemplateService.getAllSystemTemplates();
      console.log(`Found ${systemTemplates.length} system templates`);

      // Generate agreement document
      if (options.includeAgreement) {
        // Try to find a matching system template first
        const agreementTemplate = this.findTemplateByCategory(systemTemplates, 'agreements', options.agreementType);
        
        if (agreementTemplate) {
          // Use system template if available
          const agreementDoc = await this.generateSingleDocument(
            agreementTemplate,
            variables,
            `${formData.siteCode}_${formData.siteName}_Agreement`
          );
          generatedDocuments.push(agreementDoc);
        } else {
          // Fall back to built-in template
          const templateId = this.getTemplateIdFromType(options.agreementType);
          const agreementDoc = await this.generateDocumentFromBuiltIn(
            templateId,
            variables,
            `${formData.siteCode}_${formData.siteName}_Agreement`
          );
          generatedDocuments.push(agreementDoc);
        }
      }

      // Generate forwarding letter
      if (options.includeForwardingLetter) {
        // Try to find a matching system template first
        const letterTemplate = this.findTemplateByCategory(systemTemplates, 'letters');
        
        if (letterTemplate) {
          // Use system template if available
          const letterDoc = await this.generateSingleDocument(
            letterTemplate,
            variables,
            `${formData.siteCode}_${formData.siteName}_Forwarding_Letter`
          );
          generatedDocuments.push(letterDoc);
        } else {
          // Fall back to built-in template
          const letterDoc = await this.generateDocumentFromBuiltIn(
            'rof6-template',
            variables,
            `${formData.siteCode}_${formData.siteName}_Forwarding_Letter`
          );
          generatedDocuments.push(letterDoc);
        }
      }

      // Generate invoice
      if (options.includeInvoice) {
        // Try to find a matching system template first
        const invoiceTemplate = this.findTemplateByCategory(systemTemplates, 'invoices');
        
        if (invoiceTemplate) {
          // Use system template if available
          const invoiceDoc = await this.generateSingleDocument(
            invoiceTemplate,
            variables,
            `${formData.siteCode}_${formData.siteName}_Invoice`
          );
          generatedDocuments.push(invoiceDoc);
        } else {
          // Fall back to built-in template
          const invoiceDoc = await this.generateDocumentFromBuiltIn(
            'fee-note',
            variables,
            `${formData.siteCode}_${formData.siteName}_Invoice`
          );
          generatedDocuments.push(invoiceDoc);
        }
      }

      console.log(`Generated ${generatedDocuments.length} documents successfully`);
      return generatedDocuments;

    } catch (error) {
      console.error('Error generating documents:', error);
      throw new Error('Failed to generate documents from ROF 5 data');
    }
  }

  private static async generateSingleDocument(
    template: SystemTemplate,
    variables: DocumentVariable[],
    baseName: string
  ): Promise<GeneratedDocument> {
    console.log(`Generating document from system template: ${template.name}`);
    
    formData?: ROF5FormData
    try {
      // Extract HTML content from the template
      const htmlContent = await SystemTemplateService.extractTextFromTemplate(template);
      
      let finalContent: string;
      
      if (formData) {
        // Fill blank spaces with ROF5 data in fixed order
        finalContent = fillBlanksWithROF5Data(htmlContent, formData);
      } else {
        // Fallback: convert HTML to plain text and use variable replacement
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        finalContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // Apply variable replacement
        variables.forEach(variable => {
          const placeholder = `{{${variable.key}}}`;
          const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          finalContent = finalContent.replace(regex, variable.value || `[${variable.key}]`);
        });
      }
      
      // Generate the document using the document generator service
      const result = await DocumentGeneratorService.generateDocument(
        finalContent,
        [], // No need for variable replacement as we've already filled the content
        { format: 'docx', includeFormatting: true }
      );

      return {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${baseName}.docx`,
        content: result.content as Uint8Array,
        format: 'docx',
        templateUsed: template.name
      };
    } catch (error) {
      console.error('Error generating document from system template:', error);
      throw new Error(`Failed to generate document from template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static getTemplateIdFromType(agreementType?: string): string {
    if (!agreementType) return 'lease-agreement';
    
    if (agreementType.toLowerCase().includes('licence')) return 'licence-agreement';
    if (agreementType.toLowerCase().includes('wayleave')) return 'wayleave-agreement';
    
    return 'lease-agreement';
  }

  private static findTemplateByCategory(
    templates: SystemTemplate[],
    category: string,
    specificType?: string
  ): SystemTemplate | null {
    // First try to find by specific type if provided
    if (specificType) {
      const specificTemplate = templates.find(t => 
        t.category === category && 
        t.name.toLowerCase().includes(specificType.toLowerCase())
      );
      if (specificTemplate) return specificTemplate;
    }

    // Fallback to first template in category
    return templates.find(t => t.category === category) || null;
  }

  private static async generateDocumentFromBuiltIn(
    templateId: string,
    variables: DocumentVariable[],
    fileName: string
  ): Promise<GeneratedDocument> {
    console.log(`Generating document from built-in template: ${templateId}`);
    
    // Get template content from DocumentGenerator
    const templateContent = DocumentGenerator.templates[templateId]?.content || '';
    if (!templateContent) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Generate the document using the document generator service
    const result = await DocumentGeneratorService.generateDocument(
      templateContent,
      variables,
      { format: 'docx', includeFormatting: true }
    );

    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${fileName}.docx`,
      content: result.content as Uint8Array,
      format: 'docx',
      templateUsed: templateId
    };
  }

  private static extractVariablesFromROF5(formData: ROF5FormData): DocumentVariable[] {
    const currentDate = new Date();
    const variables: DocumentVariable[] = [
      // Date variables
      { key: 'current_date', value: currentDate.toLocaleDateString() },
      { key: 'current_year', value: currentDate.getFullYear().toString() },
      { key: 'commencement_date', value: formData.commencementDate || '' },
      
      // Site information
      { key: 'site_code', value: formData.siteCode || '' },
      { key: 'site_name', value: formData.siteName || '' },
      { key: 'site_location', value: formData.siteLocation || '' },
      { key: 'county', value: formData.county || '' },
      { key: 'sub_county', value: formData.subCounty || '' },
      { key: 'ward', value: formData.ward || '' },
      
      // Title information
      { key: 'title_number', value: formData.titleNumber || '' },
      { key: 'title_type', value: formData.titleType || '' },
      { key: 'registration_section', value: formData.registrationSection || '' },
      { key: 'land_area', value: formData.landArea || '' },
      { key: 'land_use', value: formData.landUse || '' },
      
      // Landlord information
      { key: 'landlord_name', value: formData.landlordName || '' },
      { key: 'landlord_type', value: formData.landlordType || '' },
      { key: 'landlord_address', value: formData.landlordAddress || '' },
      { key: 'landlord_phone', value: formData.landlordPhone || '' },
      { key: 'landlord_email', value: formData.landlordEmail || '' },
      { key: 'landlord_id', value: formData.landlordId || '' },
      
      // Lease terms
      { key: 'lease_type', value: formData.leaseType || '' },
      { key: 'lease_term', value: formData.leaseTerm || '' },
      { key: 'monthly_rent', value: formData.monthlyRent || '' },
      { key: 'annual_rent', value: formData.monthlyRent ? (parseFloat(formData.monthlyRent) * 12).toString() : '' },
      { key: 'deposit', value: formData.deposit || '' },
      { key: 'rent_escalation', value: formData.rentEscalation || '5' },
      { key: 'escalation_rate', value: formData.rentEscalation || '5' },
      
      // Additional information
      { key: 'permit_type', value: formData.permitType || '' },
      { key: 'special_conditions', value: formData.specialConditions || '' },
      { key: 'instructing_counsel', value: formData.instructingCounsel || '' },
      { key: 'urgency_level', value: formData.urgencyLevel || '' },
      { key: 'expected_completion_date', value: formData.expectedCompletionDate || '' },
      
      // Reference numbers
      { key: 'file_ref', value: `${formData.siteCode}/2024` },
      { key: 'instruction_ref', value: `ROF-${new Date().getFullYear()}-${formData.siteCode}` },
      { key: 'document_ref', value: `DOC-${formData.siteCode}-${Date.now()}` },
      
      // Tenant information (Safaricom)
      { key: 'tenant_name', value: 'Safaricom PLC' },
      { key: 'tenant_address', value: 'Safaricom Centre, Waiyaki Way, Westlands, P.O. Box 66827-00800, Nairobi' },
      { key: 'poa_name', value: formData.instructingCounsel || 'Legal Counsel' },
      
      // Document received status
      { key: 'documents_received', value: formData.documentsReceived?.join(', ') || '' }
    ];

    console.log(`Extracted ${variables.length} variables from ROF 5 form`);
    return variables;
  }

  static downloadDocument(document: GeneratedDocument): void {
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

  static downloadAllDocuments(documents: GeneratedDocument[]): void {
    documents.forEach((doc, index) => {
      setTimeout(() => this.downloadDocument(doc), index * 500); // Stagger downloads
    });
  }
}
