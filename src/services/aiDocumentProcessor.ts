import { DocumentGeneratorService } from './documentGeneratorService';

export interface VariableSuggestion {
  originalText: string;
  variableName: string;
  position: number;
  confidence: number;
  reason: string;
  category: 'date' | 'name' | 'address' | 'amount' | 'location' | 'reference' | 'other';
  contextPreview: string;
}

export interface DocumentAnalysis {
  content: string;
  suggestions: VariableSuggestion[];
  placeholders: Array<{
    text: string;
    position: number;
    suggestedVariable: string;
    isHighlighted: boolean;
    contextPreview: string;
    category: string;
  }>;
}

export class AIDocumentProcessor {
  /**
   * Universal document analyzer that detects all types of blank lines and placeholders
   */
  static async analyzeDocument(content: string): Promise<DocumentAnalysis> {
    const suggestions: VariableSuggestion[] = [];
    const placeholders: Array<{
      text: string, 
      position: number, 
      suggestedVariable: string, 
      isHighlighted: boolean,
      contextPreview: string,
      category: string
    }> = [];
    
    // Enhanced universal placeholder patterns
    const placeholderPatterns = [
      { regex: /\.{2,}/g, type: 'dots', minLength: 2 },
      { regex: /…{1,}/g, type: 'ellipsis', minLength: 1 },
      { regex: /_{2,}/g, type: 'underscores', minLength: 2 },
      { regex: /-{2,}/g, type: 'dashes', minLength: 2 },
      { regex: /={2,}/g, type: 'equals', minLength: 2 },
      { regex: /\*{2,}/g, type: 'asterisks', minLength: 2 },
      { regex: /#{2,}/g, type: 'hashes', minLength: 2 },
      { regex: /\[[\s\w]*\]/g, type: 'brackets' },
      { regex: /\([\s\w]*\)/g, type: 'parentheses' },
      { regex: /\{[\s\w]*\}/g, type: 'braces' },
      { regex: /_+\s*_+/g, type: 'spaced_underscores' },
      // Special patterns for common document formats
      { regex: /\b_+\b/g, type: 'isolated_underscores' },
      { regex: /\[.*?\]/g, type: 'bracket_content' },
      { regex: /\(.*?\)/g, type: 'parenthesis_content' },
      // Date-like placeholders
      { regex: /__\/__\/__/g, type: 'date_slashes' },
      { regex: /dd\/mm\/yyyy/gi, type: 'date_format' },
      { regex: /mm\/dd\/yyyy/gi, type: 'date_format_us' },
      // Amount placeholders
      { regex: /\$___/g, type: 'currency_blank' },
      { regex: /KES\s*___/g, type: 'kes_blank' },
      // Line patterns
      { regex: /^\s*[-_=.]{5,}\s*$/gm, type: 'full_line_blanks' }
    ];

    let fieldCounter = 1;

    // Process each pattern type
    placeholderPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const placeholder = match[0];
        const position = match.index;
        
        // Skip if it's too short for certain patterns
        if (pattern.minLength && placeholder.length < pattern.minLength) {
          continue;
        }

        // Skip common words in brackets/parentheses that aren't placeholders
        if ((pattern.type === 'bracket_content' || pattern.type === 'parenthesis_content') && 
            /^[\[\(]\s*(the|and|or|of|in|on|at|to|for|with|by)\s*[\]\)]$/i.test(placeholder)) {
          continue;
        }

        // Get context around the placeholder
        const contextRadius = 80;
        const contextStart = Math.max(0, position - contextRadius);
        const contextEnd = Math.min(content.length, position + placeholder.length + contextRadius);
        const contextPreview = content.substring(contextStart, contextEnd).trim();

        // Generate intelligent variable name based on context
        const suggestedVariable = this.generateIntelligentVariableName(
          contextPreview, 
          placeholder, 
          pattern.type,
          fieldCounter
        );

        // Determine category based on context and pattern
        const category = this.determineVariableCategory(contextPreview, placeholder, pattern.type);

        placeholders.push({
          text: placeholder,
          position: position,
          suggestedVariable: suggestedVariable,
          isHighlighted: true,
          contextPreview: this.cleanContextPreview(contextPreview, placeholder),
          category: category
        });

        fieldCounter++;
      }
    });

    // Also detect specific data patterns for suggestions
    const dataPatterns = [
      {
        regex: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
        category: 'date' as const,
        variablePrefix: 'date'
      },
      {
        regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
        category: 'date' as const,
        variablePrefix: 'date'
      },
      {
        regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
        category: 'name' as const,
        variablePrefix: 'name'
      },
      {
        regex: /\b(?:KES|USD|\$)\s*[\d,]+(?:\.\d{2})?\b/g,
        category: 'amount' as const,
        variablePrefix: 'amount'
      }
    ];

    // Analyze data patterns for suggestions
    dataPatterns.forEach(pattern => {
      let match;
      let counter = 1;
      while ((match = pattern.regex.exec(content)) !== null) {
        const originalText = match[0];
        const position = match.index;
        const contextPreview = this.getContextAroundPosition(content, position, 50);
        
        suggestions.push({
          originalText,
          variableName: `${pattern.variablePrefix}_${counter}`,
          position,
          confidence: this.calculateConfidence(originalText, pattern.category, contextPreview),
          reason: this.generateReason(originalText, pattern.category, contextPreview),
          category: pattern.category,
          contextPreview: this.cleanContextPreview(contextPreview, originalText)
        });
        
        counter++;
      }
    });

    // Remove duplicates and sort placeholders by position
    const uniquePlaceholders = this.removeDuplicatePlaceholders(placeholders);
    uniquePlaceholders.sort((a, b) => a.position - b.position);

    // Sort suggestions by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return {
      content,
      suggestions,
      placeholders: uniquePlaceholders
    };
  }

  /**
   * Generate smart variable name based on context and placeholder
   */
  static generateSmartVariableName(context: string, placeholder: string): string {
    const contextLower = context.toLowerCase();
    
    // Context-based variable mappings
    const contextMappings = [
      // Names and parties
      { keywords: ['landlord', 'lessor', 'owner'], variable: 'landlord_name' },
      { keywords: ['tenant', 'lessee', 'renter'], variable: 'tenant_name' },
      { keywords: ['witness', 'witnessed by'], variable: 'witness_name' },
      { keywords: ['agent', 'representative'], variable: 'agent_name' },
      { keywords: ['company', 'corporation', 'ltd'], variable: 'company_name' },
      
      // Dates
      { keywords: ['date', 'dated', 'day of'], variable: 'date' },
      { keywords: ['commencement', 'start', 'beginning'], variable: 'commencement_date' },
      { keywords: ['expiry', 'expiration', 'end', 'termination'], variable: 'expiry_date' },
      { keywords: ['birth', 'born'], variable: 'birth_date' },
      
      // Locations and addresses
      { keywords: ['address', 'located at', 'situate'], variable: 'address' },
      { keywords: ['site', 'premises', 'property'], variable: 'site_location' },
      { keywords: ['county', 'district'], variable: 'county' },
      { keywords: ['city', 'town'], variable: 'city' },
      { keywords: ['postal', 'p.o', 'box'], variable: 'postal_address' },
      
      // Financial terms
      { keywords: ['rent', 'rental'], variable: 'monthly_rent' },
      { keywords: ['deposit', 'security'], variable: 'deposit_amount' },
      { keywords: ['amount', 'sum', 'total'], variable: 'amount' },
      { keywords: ['salary', 'wage'], variable: 'salary' },
      { keywords: ['fee', 'charge'], variable: 'fee_amount' },
      
      // Legal and reference
      { keywords: ['title', 'title number'], variable: 'title_number' },
      { keywords: ['reference', 'ref', 'no.'], variable: 'reference_number' },
      { keywords: ['license', 'permit'], variable: 'license_number' },
      { keywords: ['id', 'identification'], variable: 'id_number' },
      
      // Contract terms
      { keywords: ['term', 'period', 'duration'], variable: 'lease_term' },
      { keywords: ['escalation', 'increase'], variable: 'escalation_rate' },
      { keywords: ['area', 'size', 'square'], variable: 'area_size' },
      
      // Contact information
      { keywords: ['phone', 'telephone', 'mobile'], variable: 'phone_number' },
      { keywords: ['email', 'e-mail'], variable: 'email_address' },
      { keywords: ['fax'], variable: 'fax_number' }
    ];

    // Check for context matches
    for (const mapping of contextMappings) {
      if (mapping.keywords.some(keyword => contextLower.includes(keyword))) {
        return mapping.variable;
      }
    }

    // Fallback based on placeholder pattern
    if (placeholder.includes('.')) return 'field_value';
    if (placeholder.includes('_')) return 'fill_blank';
    if (placeholder.includes('-')) return 'enter_value';
    
    // Generic fallback
    return 'variable_name';
  }

  /**
   * Generate intelligent variable names based on context
   */
  static generateIntelligentVariableName(
    context: string, 
    placeholder: string, 
    patternType: string,
    fallbackNumber: number
  ): string {
    const contextLower = context.toLowerCase();
    
    // Context-based variable mappings
    const contextMappings = [
      // Names and parties
      { keywords: ['landlord', 'lessor', 'owner'], variable: 'landlord_name' },
      { keywords: ['tenant', 'lessee', 'renter'], variable: 'tenant_name' },
      { keywords: ['witness', 'witnessed by'], variable: 'witness_name' },
      { keywords: ['agent', 'representative'], variable: 'agent_name' },
      { keywords: ['company', 'corporation', 'ltd'], variable: 'company_name' },
      
      // Dates
      { keywords: ['date', 'dated', 'day of'], variable: 'date' },
      { keywords: ['commencement', 'start', 'beginning'], variable: 'commencement_date' },
      { keywords: ['expiry', 'expiration', 'end', 'termination'], variable: 'expiry_date' },
      { keywords: ['birth', 'born'], variable: 'birth_date' },
      
      // Locations and addresses
      { keywords: ['address', 'located at', 'situate'], variable: 'address' },
      { keywords: ['site', 'premises', 'property'], variable: 'site_location' },
      { keywords: ['county', 'district'], variable: 'county' },
      { keywords: ['city', 'town'], variable: 'city' },
      { keywords: ['postal', 'p.o', 'box'], variable: 'postal_address' },
      
      // Financial terms
      { keywords: ['rent', 'rental'], variable: 'monthly_rent' },
      { keywords: ['deposit', 'security'], variable: 'deposit_amount' },
      { keywords: ['amount', 'sum', 'total'], variable: 'amount' },
      { keywords: ['salary', 'wage'], variable: 'salary' },
      { keywords: ['fee', 'charge'], variable: 'fee_amount' },
      
      // Legal and reference
      { keywords: ['title', 'title number'], variable: 'title_number' },
      { keywords: ['reference', 'ref', 'no.'], variable: 'reference_number' },
      { keywords: ['license', 'permit'], variable: 'license_number' },
      { keywords: ['id', 'identification'], variable: 'id_number' },
      
      // Contract terms
      { keywords: ['term', 'period', 'duration'], variable: 'lease_term' },
      { keywords: ['escalation', 'increase'], variable: 'escalation_rate' },
      { keywords: ['area', 'size', 'square'], variable: 'area_size' },
      
      // Contact information
      { keywords: ['phone', 'telephone', 'mobile'], variable: 'phone_number' },
      { keywords: ['email', 'e-mail'], variable: 'email_address' },
      { keywords: ['fax'], variable: 'fax_number' }
    ];

    // Check for context matches
    for (const mapping of contextMappings) {
      if (mapping.keywords.some(keyword => contextLower.includes(keyword))) {
        return mapping.variable;
      }
    }

    // Pattern-based fallbacks
    if (patternType === 'date_format' || patternType === 'date_slashes') {
      return `date_${fallbackNumber}`;
    }
    if (patternType === 'currency_blank' || patternType === 'kes_blank') {
      return `amount_${fallbackNumber}`;
    }

    // Generic fallback
    return `field_${fallbackNumber}`;
  }

  /**
   * Determine variable category based on context
   */
  static determineVariableCategory(context: string, placeholder: string, patternType: string): string {
    const contextLower = context.toLowerCase();

    if (patternType.includes('date') || contextLower.includes('date') || contextLower.includes('day')) {
      return 'date';
    }
    if (patternType.includes('currency') || contextLower.includes('amount') || contextLower.includes('rent') || contextLower.includes('fee')) {
      return 'amount';
    }
    if (contextLower.includes('name') || contextLower.includes('landlord') || contextLower.includes('tenant')) {
      return 'name';
    }
    if (contextLower.includes('address') || contextLower.includes('location') || contextLower.includes('premises')) {
      return 'address';
    }
    if (contextLower.includes('number') || contextLower.includes('ref') || contextLower.includes('id')) {
      return 'reference';
    }

    return 'other';
  }

  /**
   * Clean and format context preview for display
   */
  static cleanContextPreview(context: string, placeholder: string): string {
    // Replace the placeholder with a highlighted marker
    const cleanContext = context.replace(placeholder, '***BLANK***');
    
    // Clean up extra whitespace
    return cleanContext.replace(/\s+/g, ' ').trim();
  }

  /**
   * Remove duplicate placeholders based on position and content
   */
  static removeDuplicatePlaceholders(placeholders: Array<any>): Array<any> {
    const seen = new Set();
    return placeholders.filter(placeholder => {
      const key = `${placeholder.position}-${placeholder.text}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Apply AI suggestions to document content with highlighting
   */
  static applyVariableSuggestions(
    content: string, 
    suggestions: VariableSuggestion[], 
    selectedSuggestions: string[]
  ): { content: string; variables: string[] } {
    let updatedContent = content;
    const variables: string[] = [];
    
    // Apply suggestions in reverse order to maintain positions
    suggestions
      .filter(s => selectedSuggestions.includes(s.variableName))
      .sort((a, b) => b.position - a.position)
      .forEach(suggestion => {
        const placeholder = `{{${suggestion.variableName}}}`;
        updatedContent = updatedContent.substring(0, suggestion.position) + 
                        placeholder + 
                        updatedContent.substring(suggestion.position + suggestion.originalText.length);
        
        if (!variables.includes(suggestion.variableName)) {
          variables.push(suggestion.variableName);
        }
      });

    return { content: updatedContent, variables };
  }

  /**
   * Replace placeholders with variable placeholders
   */
  static replacePlaceholders(
    content: string,
    placeholderMappings: Array<{original: string, variable: string}>
  ): { content: string; variables: string[] } {
    let updatedContent = content;
    const variables: string[] = [];

    // Sort by position (longest first to avoid partial replacements)
    const sortedMappings = placeholderMappings
      .filter(mapping => mapping.variable.trim() !== '')
      .sort((a, b) => b.original.length - a.original.length);

    sortedMappings.forEach(mapping => {
      const placeholder = `{{${mapping.variable}}}`;
      const escapedOriginal = mapping.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      updatedContent = updatedContent.replace(new RegExp(escapedOriginal, 'g'), placeholder);
      
      if (!variables.includes(mapping.variable)) {
        variables.push(mapping.variable);
      }
    });

    return { content: updatedContent, variables };
  }

  /**
   * Highlight placeholders in content for editing
   */
  static highlightPlaceholders(content: string): string {
    const placeholderPatterns = [
      /\.{2,}/g,
      /…{1,}/g,
      /_{2,}/g,
      /-{2,}/g,
      /={2,}/g,
      /\*{2,}/g,
      /#{2,}/g,
      /\[.*?\]/g,
      /\(.*?\)/g,
      /\{.*?\}/g,
      /_+\s*_+/g,
      /\b_+\b/g
    ];

    let highlightedContent = content;
    
    placeholderPatterns.forEach(pattern => {
      highlightedContent = highlightedContent.replace(pattern, (match) => {
        return `<span class="bg-green-200 border-2 border-green-400 px-1 rounded cursor-pointer hover:bg-green-300" data-placeholder="${match}" title="Click to convert to variable">${match}</span>`;
      });
    });

    return highlightedContent;
  }

  private static getContextAroundPosition(content: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(content.length, position + radius);
    return content.substring(start, end);
  }

  private static calculateConfidence(text: string, category: string, context: string): number {
    let confidence = 0.5;
    
    // Increase confidence based on pattern strength
    if (category === 'date' && /\d{4}/.test(text)) confidence += 0.3;
    if (category === 'amount' && /(KES|USD|\$)/.test(text)) confidence += 0.4;
    if (category === 'name' && /^[A-Z]/.test(text)) confidence += 0.2;
    if (category === 'reference' && /\//.test(text)) confidence += 0.3;
    
    // Increase confidence based on context
    const contextLower = context.toLowerCase();
    if (contextLower.includes('date') && category === 'date') confidence += 0.2;
    if (contextLower.includes('name') && category === 'name') confidence += 0.2;
    if (contextLower.includes('amount') && category === 'amount') confidence += 0.2;
    
    return Math.min(1.0, confidence);
  }

  private static generateReason(text: string, category: string, context: string): string {
    const reasons = {
      'date': `Detected date format: ${text}`,
      'name': `Appears to be a person/entity name: ${text}`,
      'amount': `Currency amount detected: ${text}`,
      'location': `Location reference: ${text}`,
      'reference': `Document reference pattern: ${text}`,
      'address': `Address pattern detected: ${text}`,
      'other': `Pattern detected: ${text}`
    };
    
    return reasons[category] || reasons['other'];
  }
}
