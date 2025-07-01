export interface AISuggestion {
  type: 'form-completion' | 'workflow-action' | 'priority' | 'deadline';
  field?: string;
  value: string;
  confidence: number;
  reason: string;
}

export interface WorkflowSuggestion {
  action: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDays: number;
}

export class AIService {
  static async getFormSuggestions(formData: any, field: string): Promise<AISuggestion[]> {
    // Simulate AI-powered form suggestions based on existing data
    const suggestions: AISuggestion[] = [];

    // Template-specific suggestions
    if (field === 'current_date') {
      suggestions.push({
        type: 'form-completion',
        field: 'current_date',
        value: new Date().toLocaleDateString('en-GB'),
        confidence: 1.0,
        reason: 'Auto-generated current date'
      });
    }

    if (field === 'site_code' && formData.siteLocation) {
      const siteCode = this.generateSiteCode(formData.siteLocation);
      suggestions.push({
        type: 'form-completion',
        field: 'site_code',
        value: siteCode,
        confidence: 0.9,
        reason: 'Generated based on location'
      });
    }

    if (field === 'file_ref' && formData.site_code) {
      suggestions.push({
        type: 'form-completion',
        field: 'file_ref',
        value: `${formData.site_code}/2024`,
        confidence: 0.95,
        reason: 'Standard file reference format'
      });
    }

    if (field === 'tenant_name') {
      suggestions.push({
        type: 'form-completion',
        field: 'tenant_name',
        value: 'SAFARICOM PLC',
        confidence: 1.0,
        reason: 'Standard tenant name'
      });
    }

    if (field === 'tenant_address') {
      suggestions.push({
        type: 'form-completion',
        field: 'tenant_address',
        value: 'Safaricom House, Waiyaki Way, Westlands, P.O. Box 66827-00800, Nairobi',
        confidence: 1.0,
        reason: 'Standard Safaricom address'
      });
    }

    if (field === 'escalation_rate' && !formData.escalation_rate) {
      suggestions.push({
        type: 'form-completion',
        field: 'escalation_rate',
        value: '5',
        confidence: 0.8,
        reason: 'Standard escalation rate for telecom leases'
      });
    }

    if (field === 'lease_term' && formData.site_location) {
      const term = this.suggestLeaseTerm(formData.site_location);
      suggestions.push({
        type: 'form-completion',
        field: 'lease_term',
        value: term,
        confidence: 0.85,
        reason: `Recommended term for ${formData.site_location} area`
      });
    }

    if (field === 'deposit' && formData.monthly_rent) {
      const deposit = (parseFloat(formData.monthly_rent) * 2).toString();
      suggestions.push({
        type: 'form-completion',
        field: 'deposit',
        value: deposit,
        confidence: 0.9,
        reason: 'Standard deposit (2x monthly rent)'
      });
    }

    if (field === 'vat_amount' && formData.total_fees) {
      const vatAmount = (parseFloat(formData.total_fees) * 0.16).toString();
      suggestions.push({
        type: 'form-completion',
        field: 'vat_amount',
        value: vatAmount,
        confidence: 1.0,
        reason: 'VAT calculation (16%)'
      });
    }

    if (field === 'total_amount' && formData.total_fees && formData.vat_amount) {
      const totalAmount = (parseFloat(formData.total_fees) + parseFloat(formData.vat_amount)).toString();
      suggestions.push({
        type: 'form-completion',
        field: 'total_amount',
        value: totalAmount,
        confidence: 1.0,
        reason: 'Total including VAT'
      });
    }

    // Location-based suggestions
    if (field === 'siteLocation' && formData.county) {
      const locationSuggestions = this.getLocationSuggestions(formData.county);
      suggestions.push(...locationSuggestions);
    }

    if (field === 'monthly_rent' && formData.siteLocation && formData.land_area) {
      const rentSuggestion = this.getRentSuggestion(formData.siteLocation, formData.land_area);
      suggestions.push(rentSuggestion);
    }

    return suggestions;
  }

  static getWorkflowSuggestions(instruction: any): WorkflowSuggestion[] {
    const suggestions: WorkflowSuggestion[] = [];

    if (instruction.stage === 'document-drafting') {
      suggestions.push({
        action: 'Review and finalize lease agreement',
        reason: 'Standard lease template generated, requires legal review',
        priority: 'medium',
        estimatedDays: 2
      });

      if (instruction.formData?.urgencyLevel === 'high') {
        suggestions.push({
          action: 'Expedite external counsel review',
          reason: 'High priority instruction requires faster processing',
          priority: 'high',
          estimatedDays: 1
        });
      }
    }

    if (instruction.stage === 'execution') {
      suggestions.push({
        action: 'Schedule landlord meeting for signing',
        reason: 'Documents ready for execution, coordination needed',
        priority: 'medium',
        estimatedDays: 3
      });
    }

    return suggestions;
  }

  static calculateSmartPriority(formData: any): 'low' | 'medium' | 'high' {
    let score = 0;

    // Location-based priority
    if (formData.county?.toLowerCase().includes('nairobi')) score += 2;
    if (formData.siteLocation?.toLowerCase().includes('cbd')) score += 2;

    // Urgency level
    if (formData.urgencyLevel === 'high') score += 3;
    if (formData.urgencyLevel === 'medium') score += 1;

    // Lease value
    const rent = parseFloat(formData.monthlyRent || '0');
    if (rent > 500000) score += 2;
    if (rent > 200000) score += 1;

    // Lease term
    const term = parseInt(formData.leaseTerm || '0');
    if (term >= 10) score += 1;

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  static calculateSmartDeadline(formData: any, priority: string): string {
    const baseDate = new Date();
    let daysToAdd = 30; // Default

    // Adjust based on priority
    if (priority === 'high') daysToAdd = 14;
    if (priority === 'medium') daysToAdd = 21;

    // Adjust based on complexity
    if (formData.specialConditions?.length > 100) daysToAdd += 7;
    if (formData.leaseType === 'sublease') daysToAdd += 5;

    baseDate.setDate(baseDate.getDate() + daysToAdd);
    return baseDate.toISOString().split('T')[0];
  }

  private static generateSiteCode(location: string): string {
    const prefix = location.substring(0, 3).toUpperCase();
    const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${prefix}${suffix}`;
  }

  private static suggestLeaseTerm(location: string): string {
    if (location.toLowerCase().includes('cbd')) return '15';
    if (location.toLowerCase().includes('industrial')) return '25';
    return '20';
  }

  private static getLocationSuggestions(county: string): AISuggestion[] {
    const locationMap: Record<string, string[]> = {
      'nairobi': ['Westlands', 'Upper Hill', 'CBD', 'Karen', 'Runda'],
      'mombasa': ['Nyali', 'Bamburi', 'Diani', 'Kilifi'],
      'kisumu': ['Milimani', 'Kondele', 'Mamboleo']
    };

    const locations = locationMap[county.toLowerCase()] || [];
    return locations.map(location => ({
      type: 'form-completion' as const,
      field: 'siteLocation',
      value: location,
      confidence: 0.8,
      reason: `Common location in ${county} for telecom sites`
    }));
  }

  private static getLeaseTermSuggestion(location: string): AISuggestion {
    const term = location.toLowerCase().includes('cbd') ? '15' : '20';
    return {
      type: 'form-completion' as const,
      field: 'leaseTerm',
      value: term,
      confidence: 0.9,
      reason: `Standard lease term for ${location.includes('cbd') ? 'urban' : 'suburban'} areas`
    };
  }

  private static getRentSuggestion(location: string, landArea: string): AISuggestion {
    const area = parseFloat(landArea) || 1;
    let baseRate = 1000; // per sqm

    if (location.toLowerCase().includes('cbd')) baseRate = 2000;
    if (location.toLowerCase().includes('westlands')) baseRate = 1800;
    if (location.toLowerCase().includes('karen')) baseRate = 1500;

    const suggestedRent = Math.round(area * baseRate);

    return {
      type: 'form-completion' as const,
      field: 'monthlyRent',
      value: suggestedRent.toString(),
      confidence: 0.7,
      reason: `Based on market rates for ${location} (KES ${baseRate}/sqm)`
    };
  }
}
