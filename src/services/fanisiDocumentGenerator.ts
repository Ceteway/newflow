import { Document, Packer, Paragraph, TextRun } from 'docx';
import { FanisiROF5Data, FanisiTemplateVariable, FanisiValidationResult, FanisiGeneratedDocument, FanisiGenerationLog } from '@/types/fanisi';
import { ROF5FormData } from '@/hooks/useROF5Form';

export class FanisiDocumentGenerator {
  private static readonly EXPECTED_VARIABLES: (keyof FanisiROF5Data)[] = [
    'Site_Name', 'Site_Number', 'Title_Number', 'Property_Location', 'Property_Size',
    'Landlord_Name', 'Landlord_ID', 'Landlord_PIN', 'Landlord_Company_Name', 
    'Landlord_Certificate_Number', 'Landlord_Postal_Address', 'Landlord_Email',
    'Landlord_Contact_Person', 'Landlord_Contact_Number', 'Commencement_Date',
    'Term_Years', 'Renewal_Term', 'Permitted_Use', 'Escalation_Rate', 'Base_Rent',
    'Rent_Year_1', 'Rent_Year_2', 'Rent_Year_3', 'Rent_Year_4', 'Rent_Year_5',
    'Rent_Year_6', 'Rent_Year_7', 'Rent_Year_8', 'Rent_Year_9', 'Rent_Year_10',
    'Rent_Year_11', 'Rent_Year_12', 'Rent_Year_13', 'Rent_Year_14', 'Rent_Year_15',
    'Forwarding_Letter_Date', 'Execution_Method', 'Witness_Name', 'Tenant_Name',
    'Tenant_Company_Number', 'Tenant_Address', 'Tenant_Postal_Address',
    'Tenant_Contact_Person', 'Tenant_Phone', 'Tenant_Email', 'Document_Type',
    'ROF6_Date', 'Instruction_Date', 'Execution_Date', 'Registration_Date',
    'Oracle_Update_Date', 'File_Closure_Date', 'Fee_Note_Amount', 'VAT_Amount',
    'Stamp_Duty', 'Final_Total'
  ];

  private static readonly SAFARICOM_DEFAULTS: Partial<FanisiROF5Data> = {
    Tenant_Name: 'Safaricom PLC',
    Tenant_Company_Number: 'C.8/2002',
    Tenant_Address: 'Safaricom House, Waiyaki Way',
    Tenant_Postal_Address: 'P.O. Box 66827-00800, Nairobi',
    Tenant_Contact_Person: 'S. Maina',
    Tenant_Phone: '0722003272',
    Tenant_Email: 'legal@safaricom.co.ke'
  };

  /**
   * Convert ROF5 form data to Fanisi format with calculated rent schedule
   */
  static convertROF5ToFanisi(rof5Data: ROF5FormData): FanisiROF5Data {
    console.log('Converting ROF5 data to Fanisi format...');
    
    const baseRent = parseFloat(rof5Data.monthlyRent || '0');
    const escalationRate = parseFloat(rof5Data.rentEscalation || '5') / 100;
    const termYears = parseInt(rof5Data.leaseTerm || '15');
    
    // Calculate yearly rent schedule with escalation
    const rentSchedule: { [key: string]: string } = {};
    for (let year = 1; year <= 15; year++) {
      const yearlyRent = year <= termYears 
        ? Math.round(baseRent * 12 * Math.pow(1 + escalationRate, year - 1))
        : 0;
      rentSchedule[`Rent_Year_${year}`] = yearlyRent.toString();
    }

    const currentDate = new Date().toISOString().split('T')[0];
    
    const fanisiData: FanisiROF5Data = {
      // Site Information
      Site_Name: rof5Data.siteName || '',
      Site_Number: rof5Data.siteCode || '',
      Title_Number: rof5Data.titleNumber || '',
      Property_Location: rof5Data.siteLocation || '',
      Property_Size: rof5Data.landArea || '',
      
      // Landlord Information
      Landlord_Name: rof5Data.landlordName || '',
      Landlord_ID: rof5Data.landlordId || '',
      Landlord_PIN: '', // Not in ROF5 form
      Landlord_Company_Name: rof5Data.landlordType === 'company' ? rof5Data.landlordName : '',
      Landlord_Certificate_Number: '', // Not in ROF5 form
      Landlord_Postal_Address: rof5Data.landlordAddress || '',
      Landlord_Email: rof5Data.landlordEmail || '',
      Landlord_Contact_Person: rof5Data.landlordName || '',
      Landlord_Contact_Number: rof5Data.landlordPhone || '',
      
      // Lease Terms
      Commencement_Date: rof5Data.commencementDate || '',
      Term_Years: rof5Data.leaseTerm || '',
      Renewal_Term: rof5Data.leaseTerm || '', // Assuming same as initial term
      Permitted_Use: rof5Data.landUse || 'Telecommunications Infrastructure',
      Escalation_Rate: rof5Data.rentEscalation || '5',
      Base_Rent: (baseRent * 12).toString(), // Annual base rent
      
      // Yearly Rent Schedule
      ...rentSchedule,
      
      // Document Processing
      Forwarding_Letter_Date: currentDate,
      Execution_Method: 'Physical Signing',
      Witness_Name: '',
      
      // Tenant Information (Safaricom defaults)
      ...this.SAFARICOM_DEFAULTS,
      
      // Document Metadata
      Document_Type: rof5Data.leaseType || 'Lease Agreement',
      ROF6_Date: currentDate,
      Instruction_Date: currentDate,
      Execution_Date: '',
      Registration_Date: '',
      Oracle_Update_Date: '',
      File_Closure_Date: '',
      
      // Financial Information
      Fee_Note_Amount: '',
      VAT_Amount: '',
      Stamp_Duty: '',
      Final_Total: ''
    } as FanisiROF5Data;

    console.log('Fanisi data conversion completed');
    return fanisiData;
  }

  /**
   * Extract template variables from DOCX content
   */
  static async extractTemplateVariables(templateContent: string): Promise<FanisiTemplateVariable[]> {
    console.log('Extracting template variables from content...');
    
    const variables: FanisiTemplateVariable[] = [];
    
    // Define patterns for different variable formats
    const patterns = [
      { regex: /\{\{([^}]+)\}\}/g, format: 'curly' as const },
      { regex: /\[\[([^\]]+)\]\]/g, format: 'bracket' as const },
      { regex: /<([^>]+)>/g, format: 'angle' as const },
      // For highlighted text, we'll look for specific HTML patterns that might indicate highlighting
      { regex: /<mark[^>]*>([^<]+)<\/mark>/g, format: 'highlight' as const },
      { regex: /<span[^>]*background[^>]*>([^<]+)<\/span>/g, format: 'highlight' as const }
    ];

    patterns.forEach(({ regex, format }) => {
      let match;
      while ((match = regex.exec(templateContent)) !== null) {
        const variableName = match[1].trim();
        
        // Skip empty variables
        if (!variableName) continue;
        
        // Check if variable already exists
        const existingVar = variables.find(v => v.name === variableName);
        if (existingVar) continue;
        
        variables.push({
          name: variableName,
          format,
          position: match.index,
          originalText: match[0]
        });
      }
    });

    console.log(`Found ${variables.length} template variables:`, variables.map(v => v.name));
    return variables;
  }

  /**
   * Validate ROF5 data against template variables
   */
  static validateROF5Data(
    rof5Data: FanisiROF5Data, 
    templateVariables: FanisiTemplateVariable[]
  ): FanisiValidationResult {
    console.log('Validating ROF5 data against template variables...');
    
    const foundVariables: string[] = [];
    const missingFields: string[] = [];
    const unmappedVariables: string[] = [];

    // Check each template variable against ROF5 data
    templateVariables.forEach(variable => {
      const variableName = variable.name as keyof FanisiROF5Data;
      
      if (this.EXPECTED_VARIABLES.includes(variableName)) {
        if (rof5Data[variableName] && rof5Data[variableName].toString().trim() !== '') {
          foundVariables.push(variable.name);
        } else {
          missingFields.push(variable.name);
        }
      } else {
        unmappedVariables.push(variable.name);
      }
    });

    const isValid = missingFields.length === 0;
    
    console.log('Validation result:', {
      isValid,
      foundVariables: foundVariables.length,
      missingFields: missingFields.length,
      unmappedVariables: unmappedVariables.length
    });

    return {
      isValid,
      missingFields,
      foundVariables,
      unmappedVariables
    };
  }

  /**
   * Merge ROF5 data into template content
   */
  static mergeDataIntoTemplate(
    templateContent: string,
    rof5Data: FanisiROF5Data,
    templateVariables: FanisiTemplateVariable[]
  ): string {
    console.log('Merging ROF5 data into template...');
    
    let mergedContent = templateContent;
    
    // Sort variables by position (descending) to avoid position shifts during replacement
    const sortedVariables = [...templateVariables].sort((a, b) => b.position - a.position);
    
    sortedVariables.forEach(variable => {
      const variableName = variable.name as keyof FanisiROF5Data;
      let replacementValue = rof5Data[variableName]?.toString() || 'N/A';
      
      // Format specific fields
      if (variableName.includes('Date') && replacementValue !== 'N/A') {
        try {
          const date = new Date(replacementValue);
          replacementValue = date.toLocaleDateString('en-GB');
        } catch (error) {
          console.warn(`Invalid date format for ${variableName}:`, replacementValue);
        }
      }
      
      // Format currency fields
      if (variableName.includes('Rent') || variableName.includes('Amount') || variableName.includes('Total')) {
        const numValue = parseFloat(replacementValue);
        if (!isNaN(numValue) && numValue > 0) {
          replacementValue = `KES ${numValue.toLocaleString()}`;
        }
      }
      
      // Replace the variable with its value
      const regex = new RegExp(this.escapeRegExp(variable.originalText), 'g');
      mergedContent = mergedContent.replace(regex, replacementValue);
    });

    console.log('Template merge completed');
    return mergedContent;
  }

  /**
   * Generate final DOCX document
   */
  static async generateDocument(
    templateContent: Uint8Array,
    rof5Data: FanisiROF5Data
  ): Promise<FanisiGeneratedDocument> {
    console.log('Generating final DOCX document...');
    
    try {
      // For now, we'll extract text content and work with that
      // In a full implementation, you'd want to preserve the original DOCX structure
      const mammoth = await import('mammoth');
      const arrayBuffer = templateContent.buffer.slice(
        templateContent.byteOffset,
        templateContent.byteOffset + templateContent.byteLength
      );
      
      const result = await mammoth.convertToHtml({ arrayBuffer });
      let htmlContent = result.value;
      
      // Extract variables from HTML content
      const templateVariables = await this.extractTemplateVariables(htmlContent);
      
      // Validate data
      const validation = this.validateROF5Data(rof5Data, templateVariables);
      if (!validation.isValid) {
        throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
      }
      
      // Merge data into template
      const mergedContent = this.mergeDataIntoTemplate(htmlContent, rof5Data, templateVariables);
      
      // Convert back to DOCX
      const doc = new Document({
        sections: [{
          properties: {},
          children: this.htmlToParagraphs(mergedContent)
        }]
      });
      
      const docBuffer = await Packer.toBlob(doc);
      const arrayBufferResult = await docBuffer.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBufferResult);
      
      // Generate filename
      const fileName = this.generateFileName(rof5Data);
      
      const generatedDoc: FanisiGeneratedDocument = {
        id: `fanisi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        content: uint8Array,
        documentType: rof5Data.Document_Type,
        siteName: rof5Data.Site_Name,
        generatedAt: new Date().toISOString(),
        userId: undefined // Will be set by calling code if needed
      };
      
      console.log('Document generation completed:', fileName);
      return generatedDoc;
      
    } catch (error) {
      console.error('Error generating document:', error);
      throw new Error(`Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate filename based on Fanisi pattern
   */
  private static generateFileName(rof5Data: FanisiROF5Data): string {
    const docType = rof5Data.Document_Type.replace(/\s+/g, '_');
    const siteName = rof5Data.Site_Name.replace(/\s+/g, '_');
    const commencementDate = rof5Data.Commencement_Date.replace(/\//g, '-');
    
    return `Final_${docType}_${siteName}_${commencementDate}.docx`;
  }

  /**
   * Convert HTML content to DOCX paragraphs
   */
  private static htmlToParagraphs(htmlContent: string): Paragraph[] {
    // Simple HTML to paragraph conversion
    // In a full implementation, you'd want more sophisticated HTML parsing
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    const lines = textContent.split('\n').filter(line => line.trim());
    
    return lines.map(line => new Paragraph({
      children: [new TextRun(line.trim())]
    }));
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Log document generation
   */
  static logGeneration(
    document: FanisiGeneratedDocument,
    status: 'success' | 'error',
    errorMessage?: string
  ): FanisiGenerationLog {
    const log: FanisiGenerationLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      siteName: document.siteName,
      documentType: document.documentType,
      generatedFileName: document.fileName,
      timestamp: new Date().toISOString(),
      userId: document.userId,
      status,
      errorMessage
    };
    
    // In a full implementation, you'd save this to a database
    console.log('Document generation log:', log);
    
    return log;
  }

  /**
   * Download generated document
   */
  static downloadDocument(document: FanisiGeneratedDocument): void {
    try {
      console.log('Downloading Fanisi document:', document.fileName);
      
      const blob = new Blob([document.content], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = document.fileName;
      link.style.display = 'none';
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Fanisi document download initiated successfully');
    } catch (error) {
      console.error('Error downloading Fanisi document:', error);
      throw new Error('Failed to download document');
    }
  }
}