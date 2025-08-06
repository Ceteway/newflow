import { ROF5FormData } from "@/hooks/useROF5Form";

export interface PlaceholderMapping {
  id: string;
  order: number;
  pattern: string;
  description: string;
  rof5Field: keyof ROF5FormData | 'calculated';
  getValue: (formData: ROF5FormData) => string;
}

export interface DetectedPlaceholder {
  id: string;
  order: number;
  pattern: string;
  position: number;
  originalText: string;
  description: string;
  value: string;
  filled: boolean;
}

export class TemplatePlaceholderService {
  // Define placeholder mappings for each template type
  private static readonly TEMPLATE_MAPPINGS: Record<string, PlaceholderMapping[]> = {
    'agreement-to-lease': [
      {
        id: 'landlord-name-1',
        order: 1,
        pattern: 'from………………………………………………………(as the "Landlord")',
        description: 'Landlord Name',
        rof5Field: 'landlordName',
        getValue: (data) => data.landlordName || '[Landlord Name]'
      },
      {
        id: 'land-reference-2',
        order: 2,
        pattern: 'Part of Property Land Reference Number: ……………………………………………',
        description: 'Land Reference Number',
        rof5Field: 'titleNumber',
        getValue: (data) => data.titleNumber || '[Title Number]'
      },
      {
        id: 'date-3',
        order: 3,
        pattern: 'this day of 20......',
        description: 'Date',
        rof5Field: 'calculated',
        getValue: () => {
          const date = new Date();
          const day = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'long' });
          const year = date.getFullYear();
          return `${day} day of ${month} ${year}`;
        }
      },
      {
        id: 'commencement-date-4',
        order: 4,
        pattern: 'The Commencement Date: ……………………………………………………',
        description: 'Commencement Date',
        rof5Field: 'commencementDate',
        getValue: (data) => data.commencementDate || '[Commencement Date]'
      },
      {
        id: 'land-description-5',
        order: 5,
        pattern: 'The Land: all the Landlord\'s land known as … .........................',
        description: 'Land Description',
        rof5Field: 'siteLocation',
        getValue: (data) => data.siteLocation || '[Site Location]'
      },
      {
        id: 'landlord-name-6',
        order: 6,
        pattern: 'The Landlord: ……………………………….',
        description: 'Landlord Name (Second Reference)',
        rof5Field: 'landlordName',
        getValue: (data) => data.landlordName || '[Landlord Name]'
      },
      {
        id: 'postal-address-7',
        order: 7,
        pattern: 'whose postal address is P.O. BOX ……………………………',
        description: 'Postal Address',
        rof5Field: 'landlordAddress',
        getValue: (data) => data.landlordAddress || '[Landlord Address]'
      },
      // Rent schedule for years 1-20
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `rent-year-${i + 8}`,
        order: i + 8,
        pattern: `${i === 0 ? 'First' : i === 1 ? 'Second' : i === 2 ? 'Third' : i === 3 ? 'Fourth' : i === 4 ? 'Fifth' : i === 5 ? 'Sixth' : i === 6 ? 'Seventh' : i === 7 ? 'Eighth' : i === 8 ? 'Ninth' : 'Tenth'} Year ${i === 0 ? 'from the Commencement Date' : 'of the Term'}: Kenya Shillings ……………………………………………`,
        description: `Year ${i + 1} Rent`,
        rof5Field: 'calculated' as const,
        getValue: (data: ROF5FormData) => {
          const baseRent = parseFloat(data.monthlyRent || '0');
          const escalationRate = parseFloat(data.rentEscalation || '5') / 100;
          const yearlyRent = Math.round(baseRent * 12 * Math.pow(1 + escalationRate, i));
          return `${yearlyRent.toLocaleString()} (K.Shs. ${yearlyRent.toLocaleString()}/=)`;
        }
      })),
      {
        id: 'lease-term-18',
        order: 18,
        pattern: 'The Term: shall be for a period of ……… (…..) Years',
        description: 'Lease Term',
        rof5Field: 'leaseTerm',
        getValue: (data) => `${data.leaseTerm || '[Term]'} (${data.leaseTerm || '[Term]'}) Years`
      },
      {
        id: 'renewal-option-19',
        order: 19,
        pattern: 'Tenant shall have the option to renew for a further ………….(…)',
        description: 'Renewal Option',
        rof5Field: 'leaseTerm',
        getValue: (data) => `${data.leaseTerm || '[Term]'} (${data.leaseTerm || '[Term]'})`
      },
      {
        id: 'consecutive-term-20',
        order: 20,
        pattern: 'Consecutive term of ………. (…) years',
        description: 'Consecutive Term',
        rof5Field: 'leaseTerm',
        getValue: (data) => `${data.leaseTerm || '[Term]'} (${data.leaseTerm || '[Term]'}) years`
      }
    ],

    'interim-agreement': [
      {
        id: 'landlord-name-1',
        order: 1,
        pattern: 'from …………………………………………………. (as the "Landlord")',
        description: 'Landlord Name',
        rof5Field: 'landlordName',
        getValue: (data) => data.landlordName || '[Landlord Name]'
      },
      {
        id: 'title-number-2',
        order: 2,
        pattern: 'Part of Property Title Number: ...................................................',
        description: 'Title Number',
        rof5Field: 'titleNumber',
        getValue: (data) => data.titleNumber || '[Title Number]'
      },
      {
        id: 'agreement-date-3',
        order: 3,
        pattern: 'THIS AGREEMENT is made this ….. ..  day of…… 20………',
        description: 'Agreement Date',
        rof5Field: 'calculated',
        getValue: () => {
          const date = new Date();
          const day = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'long' });
          const year = date.getFullYear();
          return `${day} day of ${month} ${year}`;
        }
      },
      // Add more mappings for interim agreement...
    ],

    'lease-peppercon': [
      {
        id: 'landlord-name-1',
        order: 1,
        pattern: 'from …………………………………………………. (as the "Landlord")',
        description: 'Landlord Name',
        rof5Field: 'landlordName',
        getValue: (data) => data.landlordName || '[Landlord Name]'
      },
      {
        id: 'land-reference-2',
        order: 2,
        pattern: 'Part of Property Land Reference Number: .............................................…',
        description: 'Land Reference Number',
        rof5Field: 'titleNumber',
        getValue: (data) => data.titleNumber || '[Title Number]'
      },
      // Add more mappings...
    ],

    'lease-template-2022': [
      // Similar structure for lease template 2022
    ],

    'letter-to-offer': [
      {
        id: 'landlord-details-1',
        order: 1,
        pattern: 'Landlord:  …………………………P.O. Box …………………… ………………..Contact Person: …………………. -07…………../landline ……………………',
        description: 'Landlord Details',
        rof5Field: 'calculated',
        getValue: (data) => `${data.landlordName || '[Landlord Name]'} P.O. Box ${data.landlordAddress || '[Address]'} Contact Person: ${data.landlordName || '[Contact]'} - ${data.landlordPhone || '[Phone]'}`
      },
      // Add more mappings...
    ],

    'licence-agreement-peppercon': [
      {
        id: 'licence-date-1',
        order: 1,
        pattern: 'This Licence Agreement is made this ………….day of……….20……….',
        description: 'Licence Date',
        rof5Field: 'calculated',
        getValue: () => {
          const date = new Date();
          const day = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'long' });
          const year = date.getFullYear();
          return `${day} day of ${month} ${year}`;
        }
      },
      // Add more mappings...
    ],

    'licence-agreement': [
      // Similar structure for licence agreement
    ],

    'residential-lease-template': [
      {
        id: 'lease-date-1',
        order: 1,
        pattern: 'Dated       …….  20…',
        description: 'Lease Date',
        rof5Field: 'calculated',
        getValue: () => {
          const date = new Date();
          return `${date.getDate()} ${date.getFullYear()}`;
        }
      },
      // Add more mappings...
    ],

    'retail-shop-lease-template': [
      {
        id: 'lease-date-1',
        order: 1,
        pattern: 'DATED THE……………DAY OF ……………. 20……….',
        description: 'Lease Date',
        rof5Field: 'calculated',
        getValue: () => {
          const date = new Date();
          const day = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
          const year = date.getFullYear();
          return `${day} DAY OF ${month} ${year}`;
        }
      },
      // Add more mappings...
    ]
  };

  /**
   * Detect template type based on content
   */
  static detectTemplateType(content: string): string | null {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('agreement to lease')) return 'agreement-to-lease';
    if (contentLower.includes('interim agreement')) return 'interim-agreement';
    if (contentLower.includes('lease peppercon') || contentLower.includes('peppercorn')) return 'lease-peppercon';
    if (contentLower.includes('lease template 2022')) return 'lease-template-2022';
    if (contentLower.includes('letter to offer')) return 'letter-to-offer';
    if (contentLower.includes('licence agreement peppercon')) return 'licence-agreement-peppercon';
    if (contentLower.includes('licence agreement')) return 'licence-agreement';
    if (contentLower.includes('residential lease')) return 'residential-lease-template';
    if (contentLower.includes('retail shop lease')) return 'retail-shop-lease-template';
    
    return null;
  }

  /**
   * Detect and mark placeholders in template content
   */
  static detectPlaceholders(content: string, templateType: string): { content: string; placeholders: DetectedPlaceholder[] } {
    console.log(`Detecting placeholders for template type: ${templateType}`);
    
    const mappings = this.TEMPLATE_MAPPINGS[templateType] || [];
    const placeholders: DetectedPlaceholder[] = [];
    let processedContent = content;

    // Enhanced patterns to detect various placeholder formats
    const dotPatterns = [
      /\.{3,}/g,           // 3 or more dots
      /…{1,}/g,            // Unicode ellipsis
      /_{3,}/g,            // 3 or more underscores
      /-{3,}/g,            // 3 or more dashes
      /\[\.{3,}\]/g,       // Bracketed dots
      /\[_{3,}\]/g,        // Bracketed underscores
      /\[…{1,}\]/g         // Bracketed ellipsis
    ];

    // Process each pattern and convert to marked placeholders
    dotPatterns.forEach(pattern => {
      processedContent = processedContent.replace(pattern, (match, offset) => {
        const placeholderId = `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const length = Math.max(10, match.length);
        
        // Mark with green background for easy identification
        return `<span class="placeholder-marker" data-id="${placeholderId}" data-length="${length}" style="background-color: #dcfce7; border: 1px solid #16a34a; padding: 2px 4px; border-radius: 3px;">${match}</span>`;
      });
    });

    // Extract all marked placeholders
    const placeholderRegex = /<span class="placeholder-marker" data-id="([^"]*)" data-length="([^"]*)"[^>]*>(.*?)<\/span>/g;
    let match;
    let orderCounter = 1;

    while ((match = placeholderRegex.exec(processedContent)) !== null) {
      const id = match[1];
      const length = parseInt(match[2]);
      const originalText = match[3];
      
      // Try to find matching mapping based on surrounding context
      const mapping = this.findBestMapping(content, match.index, mappings, orderCounter);
      
      placeholders.push({
        id,
        order: orderCounter,
        pattern: originalText,
        position: match.index,
        originalText,
        description: mapping?.description || `Placeholder ${orderCounter}`,
        value: '', // Will be filled later
        filled: false
      });
      
      orderCounter++;
    }

    console.log(`Detected ${placeholders.length} placeholders in template`);
    return { content: processedContent, placeholders };
  }

  /**
   * Fill placeholders with ROF5 data in systematic order
   */
  static fillPlaceholdersWithROF5(
    content: string, 
    placeholders: DetectedPlaceholder[], 
    formData: ROF5FormData,
    templateType: string
  ): { content: string; filledPlaceholders: DetectedPlaceholder[] } {
    console.log('Filling placeholders with ROF5 data in systematic order...');
    
    const mappings = this.TEMPLATE_MAPPINGS[templateType] || [];
    let filledContent = content;
    const filledPlaceholders: DetectedPlaceholder[] = [];

    // Sort placeholders by order to fill systematically
    const sortedPlaceholders = [...placeholders].sort((a, b) => a.order - b.order);

    sortedPlaceholders.forEach((placeholder, index) => {
      // Find corresponding mapping or use index-based mapping
      const mapping = mappings[index] || this.createDefaultMapping(index + 1, formData);
      const value = mapping.getValue(formData);

      // Update the placeholder in content
      const regex = new RegExp(`<span class="placeholder-marker" data-id="${placeholder.id}"[^>]*>.*?</span>`, 'g');
      filledContent = filledContent.replace(regex, 
        `<span class="filled-placeholder" data-id="${placeholder.id}" style="background-color: #dcfce7; border: 1px solid #16a34a; padding: 2px 4px; border-radius: 3px; font-weight: 500;">${value}</span>`
      );

      // Create filled placeholder record
      filledPlaceholders.push({
        ...placeholder,
        value,
        filled: true,
        description: mapping.description
      });
    });

    console.log(`Filled ${filledPlaceholders.length} placeholders systematically`);
    return { content: filledContent, filledPlaceholders };
  }

  /**
   * Generate preview content with placeholders highlighted
   */
  static generatePreviewContent(content: string, placeholders: DetectedPlaceholder[]): string {
    let previewContent = content;

    // Convert placeholder markers to preview format
    placeholders.forEach(placeholder => {
      const regex = new RegExp(`<span class="placeholder-marker" data-id="${placeholder.id}"[^>]*>.*?</span>`, 'g');
      previewContent = previewContent.replace(regex, 
        `<span class="preview-placeholder" style="background-color: #fef3c7; border: 2px dashed #f59e0b; padding: 4px 8px; border-radius: 4px; font-weight: 500; color: #92400e;">[${placeholder.description}]</span>`
      );
    });

    return previewContent;
  }

  /**
   * Calculate rent schedule based on ROF5 data
   */
  static calculateRentSchedule(formData: ROF5FormData, years: number = 15): string[] {
    const baseRent = parseFloat(formData.monthlyRent || '0');
    const escalationRate = parseFloat(formData.rentEscalation || '5') / 100;
    const schedule: string[] = [];

    for (let year = 1; year <= years; year++) {
      const yearlyRent = Math.round(baseRent * 12 * Math.pow(1 + escalationRate, year - 1));
      schedule.push(`${yearlyRent.toLocaleString()} (K.Shs. ${yearlyRent.toLocaleString()}/=)`);
    }

    return schedule;
  }

  /**
   * Find best mapping based on context
   */
  private static findBestMapping(
    content: string, 
    position: number, 
    mappings: PlaceholderMapping[], 
    order: number
  ): PlaceholderMapping | null {
    // Extract context around the position
    const contextStart = Math.max(0, position - 100);
    const contextEnd = Math.min(content.length, position + 100);
    const context = content.substring(contextStart, contextEnd).toLowerCase();

    // Try to find mapping based on context keywords
    for (const mapping of mappings) {
      if (mapping.order === order) {
        return mapping;
      }
    }

    return null;
  }

  /**
   * Create default mapping for unmapped placeholders
   */
  private static createDefaultMapping(order: number, formData: ROF5FormData): PlaceholderMapping {
    return {
      id: `default-${order}`,
      order,
      pattern: `Placeholder ${order}`,
      description: `Placeholder ${order}`,
      rof5Field: 'siteName',
      getValue: () => `[Placeholder ${order}]`
    };
  }

  /**
   * Validate that all required placeholders are filled
   */
  static validateFilledPlaceholders(placeholders: DetectedPlaceholder[]): {
    isValid: boolean;
    unfilledCount: number;
    unfilledPlaceholders: DetectedPlaceholder[];
  } {
    const unfilled = placeholders.filter(p => !p.filled || !p.value || p.value.trim() === '');
    
    return {
      isValid: unfilled.length === 0,
      unfilledCount: unfilled.length,
      unfilledPlaceholders: unfilled
    };
  }
}