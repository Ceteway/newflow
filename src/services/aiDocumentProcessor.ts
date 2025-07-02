
import { DocumentGeneratorService } from './documentGeneratorService';

export interface VariableSuggestion {
  originalText: string;
  variableName: string;
  position: number;
  confidence: number;
  reason: string;
  category: 'date' | 'name' | 'address' | 'amount' | 'location' | 'reference' | 'other';
}

export interface DocumentAnalysis {
  content: string;
  suggestions: VariableSuggestion[];
  placeholders: Array<{
    text: string;
    position: number;
    suggestedVariable: string;
    isHighlighted: boolean;
  }>;
}

export class AIDocumentProcessor {
  /**
   * Analyze uploaded document and suggest variable placements with enhanced dot detection
   */
  static async analyzeDocument(content: string): Promise<DocumentAnalysis> {
    const suggestions: VariableSuggestion[] = [];
    const placeholders: Array<{text: string, position: number, suggestedVariable: string, isHighlighted: boolean}> = [];
    
    // Enhanced placeholder patterns including dots
    const placeholderPatterns = [
      { regex: /\.{3,}/g, type: 'dot_placeholder' },
      { regex: /_{3,}/g, type: 'underscore_blank' },
      { regex: /-{3,}/g, type: 'dash_blank' },
      { regex: /\[.*?\]/g, type: 'bracket_placeholder' },
      { regex: /\(.*?\)/g, type: 'parenthesis_placeholder' },
      { regex: /\b_+\b/g, type: 'single_underscore' },
      { regex: /\.\.\.[^.]*\.\.\./g, type: 'triple_dot_enclosed' }
    ];

    // Find all placeholder patterns
    placeholderPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const placeholder = match[0];
        const position = match.index;
        
        // Determine what type of variable this should be based on context
        const context = this.getContextAroundPosition(content, position, 50);
        const suggestedVariable = this.suggestVariableFromContext(context, placeholder);
        
        placeholders.push({
          text: placeholder,
          position: position,
          suggestedVariable: suggestedVariable,
          isHighlighted: true
        });
      }
    });

    // Detect specific data patterns that should be variables
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
        regex: /\bKES\s*[\d,]+(?:\.\d{2})?\b/g,
        category: 'amount' as const,
        variablePrefix: 'amount'
      },
      {
        regex: /\b\d+\s*(?:years?|months?|days?)\b/g,
        category: 'date' as const,
        variablePrefix: 'duration'
      },
      {
        regex: /\b[A-Z]+\/[A-Z]+\/\d+\b/g,
        category: 'reference' as const,
        variablePrefix: 'reference'
      },
      {
        regex: /\bP\.O\.?\s*Box\s*\d+/g,
        category: 'address' as const,
        variablePrefix: 'address'
      }
    ];

    // Analyze each pattern
    dataPatterns.forEach(pattern => {
      let match;
      let counter = 1;
      while ((match = pattern.regex.exec(content)) !== null) {
        const originalText = match[0];
        const position = match.index;
        const context = this.getContextAroundPosition(content, position, 30);
        
        suggestions.push({
          originalText,
          variableName: `${pattern.variablePrefix}_${counter}`,
          position,
          confidence: this.calculateConfidence(originalText, pattern.category, context),
          reason: this.generateReason(originalText, pattern.category, context),
          category: pattern.category
        });
        
        counter++;
      }
    });

    // Sort suggestions by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return {
      content,
      suggestions,
      placeholders
    };
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

    placeholderMappings.forEach(mapping => {
      const placeholder = `{{${mapping.variable}}}`;
      updatedContent = updatedContent.replace(new RegExp(mapping.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
      
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
      /\.{3,}/g,
      /_{3,}/g,
      /-{3,}/g,
      /\[.*?\]/g,
      /\(.*?\)/g
    ];

    let highlightedContent = content;
    
    placeholderPatterns.forEach(pattern => {
      highlightedContent = highlightedContent.replace(pattern, (match) => {
        return `<span class="bg-green-200 border-2 border-green-400 px-1 rounded cursor-pointer hover:bg-green-300" data-placeholder="${match}">${match}</span>`;
      });
    });

    return highlightedContent;
  }

  /**
   * Generate smart variable names based on template reference
   */
  static generateSmartVariableName(context: string, placeholder: string): string {
    const contextLower = context.toLowerCase();
    
    // Template variable mappings
    const variableMappings = [
      { keywords: ['landlord', 'owner'], variable: 'landlord_name' },
      { keywords: ['tenant', 'safaricom'], variable: 'tenant_name' },
      { keywords: ['site', 'location', 'premises'], variable: 'site_location' },
      { keywords: ['rent', 'rental', 'monthly'], variable: 'monthly_rent' },
      { keywords: ['deposit', 'security'], variable: 'deposit' },
      { keywords: ['date', 'commencement', 'start'], variable: 'commencement_date' },
      { keywords: ['expiry', 'end', 'termination'], variable: 'expiry_date' },
      { keywords: ['title', 'number'], variable: 'title_number' },
      { keywords: ['address', 'postal'], variable: 'address' },
      { keywords: ['term', 'period'], variable: 'lease_term' },
      { keywords: ['escalation', 'increase'], variable: 'escalation_rate' },
      { keywords: ['county'], variable: 'county' },
      { keywords: ['sub county'], variable: 'sub_county' },
      { keywords: ['area', 'size'], variable: 'land_area' }
    ];

    for (const mapping of variableMappings) {
      if (mapping.keywords.some(keyword => contextLower.includes(keyword))) {
        return mapping.variable;
      }
    }

    // Generate generic variable name
    const words = context.match(/\b[a-zA-Z]+\b/g) || [];
    const relevantWords = words.slice(-3).join('_').toLowerCase();
    return relevantWords || 'custom_field';
  }

  private static getContextAroundPosition(content: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(content.length, position + radius);
    return content.substring(start, end);
  }

  private static suggestVariableFromContext(context: string, placeholder: string): string {
    return this.generateSmartVariableName(context, placeholder);
  }

  private static calculateConfidence(text: string, category: string, context: string): number {
    let confidence = 0.5;
    
    // Increase confidence based on pattern strength
    if (category === 'date' && /\d{4}/.test(text)) confidence += 0.3;
    if (category === 'amount' && /KES/.test(text)) confidence += 0.4;
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
      'other': `Pattern detected: ${text}`
    };
    
    return reasons[category] || reasons['other'];
  }
}
