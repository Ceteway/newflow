
export interface DocumentVariable {
  key: string;
  value: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

export class DocumentGenerator {
  static templates: Record<string, DocumentTemplate> = {
    'lease-agreement': {
      id: 'lease-agreement',
      name: 'Lease Agreement',
      content: `
LEASE AGREEMENT

THIS LEASE AGREEMENT is made this {{current_date}} between {{landlord_name}} of {{landlord_address}} (the "Landlord") and {{tenant_name}} of {{tenant_address}} (the "Tenant").

PREMISES: The premises located at {{site_location}}, Title Number {{title_number}}, measuring approximately {{land_area}}.

TERM: This lease shall commence on {{commencement_date}} for a period of {{lease_term}} years.

RENT: The monthly rent shall be KES {{monthly_rent}}, payable in advance on the first day of each month, subject to annual escalation of {{escalation_rate}}% per annum.

DEPOSIT: A security deposit of KES {{deposit}} shall be paid upon execution of this agreement.

Site Code: {{site_code}}
File Reference: {{file_ref}}

IN WITNESS WHEREOF, the parties have executed this agreement on the date first written above.

Landlord: _________________    Tenant: _________________
{{landlord_name}}             {{tenant_name}}
`,
      variables: ['current_date', 'landlord_name', 'landlord_address', 'tenant_name', 'tenant_address', 'site_location', 'title_number', 'land_area', 'commencement_date', 'lease_term', 'monthly_rent', 'escalation_rate', 'deposit', 'site_code', 'file_ref']
    },
    'rof6-template': {
      id: 'rof6-template',
      name: 'ROF 6 Template',
      content: `
REQUEST FOR OPINION FORM 6 (ROF 6)
COMPLETION REPORT

Site Code: {{site_code}}
Location: {{site_location}}
File Reference: {{file_ref}}
Date: {{current_date}}

To: In-House Counsel
From: External Counsel

RE: {{landlord_name}} - {{site_location}}

We confirm that we have completed the above instruction and attach the following documents:

1. Original executed {{lease_type}}
2. Certified copy of Title Deed
3. Consent to Lease (if applicable)
4. Registration Certificate

The documents have been duly executed, stamped and registered where applicable.

Total Professional Fees: KES {{total_fees}}
VAT (16%): KES {{vat_amount}}
Total Amount Due: KES {{total_amount}}

Yours faithfully,
External Counsel
`,
      variables: ['site_code', 'site_location', 'file_ref', 'current_date', 'landlord_name', 'lease_type', 'total_fees', 'vat_amount', 'total_amount']
    },
    'licence-agreement': {
      id: 'licence-agreement',
      name: 'Licence Agreement',
      content: `
LICENCE AGREEMENT

THIS LICENCE AGREEMENT is made this {{current_date}} between {{landlord_name}} of {{landlord_address}} (the "Licensor") and {{tenant_name}} of {{tenant_address}} (the "Licensee").

LICENSED PREMISES: The premises located at {{site_location}}, Title Number {{title_number}}, measuring approximately {{land_area}}.

LICENCE PERIOD: This licence shall commence on {{commencement_date}} for a period of {{lease_term}} years.

LICENCE FEE: The monthly licence fee shall be KES {{monthly_rent}}, payable monthly in advance.

Site Code: {{site_code}}
File Reference: {{file_ref}}

IN WITNESS WHEREOF, the parties have executed this agreement.

Licensor: _________________    Licensee: _________________
{{landlord_name}}             {{tenant_name}}
`,
      variables: ['current_date', 'landlord_name', 'landlord_address', 'tenant_name', 'tenant_address', 'site_location', 'title_number', 'land_area', 'commencement_date', 'lease_term', 'monthly_rent', 'site_code', 'file_ref']
    },
    'wayleave-agreement': {
      id: 'wayleave-agreement',
      name: 'Wayleave Agreement',
      content: `
WAYLEAVE AGREEMENT

THIS WAYLEAVE AGREEMENT is made this {{current_date}} between {{landlord_name}} of {{landlord_address}} (the "Grantor") and {{tenant_name}} of {{tenant_address}} (the "Grantee").

PROPERTY: The property located at {{site_location}}, Title Number {{title_number}}.

WAYLEAVE RIGHTS: The Grantor grants to the Grantee rights to install and maintain telecommunications equipment.

ANNUAL PAYMENT: KES {{annual_rent}} payable annually.

Site Code: {{site_code}}
File Reference: {{file_ref}}

Grantor: _________________    Grantee: _________________
{{landlord_name}}             {{tenant_name}}
`,
      variables: ['current_date', 'landlord_name', 'landlord_address', 'tenant_name', 'tenant_address', 'site_location', 'title_number', 'annual_rent', 'site_code', 'file_ref']
    },
    'fee-note': {
      id: 'fee-note',
      name: 'Fee Note',
      content: `
PROFESSIONAL FEE NOTE

Date: {{current_date}}
File Reference: {{file_ref}}
Site Code: {{site_code}}

TO: {{tenant_name}}
    {{tenant_address}}

RE: {{site_location}} - {{landlord_name}}

Professional Services Rendered:
- Legal advice and document preparation
- Due diligence and title verification
- Lease negotiation and execution

Professional Fees: KES {{total_fees}}
VAT (16%): KES {{vat_amount}}
TOTAL AMOUNT DUE: KES {{total_amount}}

Payment due within 30 days of this invoice date.

External Counsel
`,
      variables: ['current_date', 'file_ref', 'site_code', 'tenant_name', 'tenant_address', 'site_location', 'landlord_name', 'total_fees', 'vat_amount', 'total_amount']
    }
  };

  static populateTemplate(templateId: string, variables: DocumentVariable[]): string {
    const template = this.templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let content = template.content;
    variables.forEach(variable => {
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      content = content.replace(regex, variable.value);
    });

    return content;
  }

  static generatePDF(content: string, filename: string): Blob {
    // In a real implementation, you would use a PDF library like jsPDF or similar
    // For now, we'll create a simple text blob
    return new Blob([content], { type: 'text/plain' });
  }

  static downloadDocument(content: string, filename: string): void {
    const blob = this.generatePDF(content, filename);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
