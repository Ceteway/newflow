export interface FanisiROF5Data {
  // Site Information
  Site_Name: string;
  Site_Number: string;
  Title_Number: string;
  Property_Location: string;
  Property_Size: string;
  
  // Landlord Information
  Landlord_Name: string;
  Landlord_ID: string;
  Landlord_PIN: string;
  Landlord_Company_Name: string;
  Landlord_Certificate_Number: string;
  Landlord_Postal_Address: string;
  Landlord_Email: string;
  Landlord_Contact_Person: string;
  Landlord_Contact_Number: string;
  
  // Lease Terms
  Commencement_Date: string;
  Term_Years: string;
  Renewal_Term: string;
  Permitted_Use: string;
  Escalation_Rate: string;
  Base_Rent: string;
  
  // Yearly Rent Schedule
  Rent_Year_1: string;
  Rent_Year_2: string;
  Rent_Year_3: string;
  Rent_Year_4: string;
  Rent_Year_5: string;
  Rent_Year_6: string;
  Rent_Year_7: string;
  Rent_Year_8: string;
  Rent_Year_9: string;
  Rent_Year_10: string;
  Rent_Year_11: string;
  Rent_Year_12: string;
  Rent_Year_13: string;
  Rent_Year_14: string;
  Rent_Year_15: string;
  
  // Document Processing
  Forwarding_Letter_Date: string;
  Execution_Method: string;
  Witness_Name: string;
  
  // Tenant Information (Pre-filled for Safaricom)
  Tenant_Name: string;
  Tenant_Company_Number: string;
  Tenant_Address: string;
  Tenant_Postal_Address: string;
  Tenant_Contact_Person: string;
  Tenant_Phone: string;
  Tenant_Email: string;
  
  // Document Metadata
  Document_Type: string;
  ROF6_Date: string;
  Instruction_Date: string;
  Execution_Date: string;
  Registration_Date: string;
  Oracle_Update_Date: string;
  File_Closure_Date: string;
  
  // Financial Information
  Fee_Note_Amount: string;
  VAT_Amount: string;
  Stamp_Duty: string;
  Final_Total: string;
}

export interface FanisiTemplateVariable {
  name: string;
  format: 'curly' | 'bracket' | 'angle' | 'highlight';
  position: number;
  originalText: string;
}

export interface FanisiValidationResult {
  isValid: boolean;
  missingFields: string[];
  foundVariables: string[];
  unmappedVariables: string[];
}

export interface FanisiGeneratedDocument {
  id: string;
  fileName: string;
  content: Uint8Array;
  documentType: string;
  siteName: string;
  generatedAt: string;
  userId?: string;
}

export interface FanisiGenerationLog {
  id: string;
  siteName: string;
  documentType: string;
  generatedFileName: string;
  timestamp: string;
  userId?: string;
  status: 'success' | 'error';
  errorMessage?: string;
}