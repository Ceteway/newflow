export interface PlaceholderMatch {
  text: string;
  suggestedVariable: string;
  category: string;
  contextPreview?: string;
  confidence?: number;
}

export interface VariableSuggestion {
  originalText: string;
  variableName: string;
  reason: string;
  confidence: number;
  category: string;
  contextPreview?: string;
}

export interface DocumentAnalysis {
  placeholders: PlaceholderMatch[];
  suggestions: VariableSuggestion[];
}

export class AIDocumentProcessor {
  static async analyzeDocument(content: string): Promise<DocumentAnalysis> {
    // Enhanced placeholder detection patterns
    const placeholderPatterns = [
      /\.{3,}/g,           // Three or more dots
      /-{3,}/g,            // Three or more dashes
      /_{3,}/g,            // Three or more underscores
      /\[([^\]]*)\]/g,     // Bracketed text
      /\(([^)]*)\)/g,      // Parenthetical placeholders
      /\s+_+\s+/g,         // Underscores with spaces
      /\s+\.+\s+/g,        // Dots with spaces
    ];

    const placeholders: PlaceholderMatch[] = [];
    const suggestions: VariableSuggestion[] = [];

    // Find placeholders
    placeholderPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const matchText = match[0];
        const context = this.getContext(content, match.index);
        const suggestedVariable = this.generateSmartVariableName(context, matchText);
        const category = this.categorizeField(context, matchText);
        
        placeholders.push({
          text: matchText,
          suggestedVariable,
          category,
          contextPreview: context,
          confidence: 0.9
        });
      }
    });

    // Find potential data patterns for suggestions
    const dataPatterns = [
      /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, // Dates
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,               // Names
      /\b\d+[,.]?\d*\b/g,                           // Numbers/amounts
      /\b[A-Z][a-z]+ (Street|Road|Avenue|Drive)\b/g, // Addresses
    ];

    dataPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const matchText = match[0];
        const context = this.getContext(content, match.index);
        const variableName = this.generateSmartVariableName(context, matchText);
        const category = this.categorizeField(context, matchText);
        
        suggestions.push({
          originalText: matchText,
          variableName,
          reason: `Detected ${category} pattern that could be made variable`,
          confidence: 0.8,
          category,
          contextPreview: context
        });
      }
    });

    return {
      placeholders: this.removeDuplicates(placeholders),
      suggestions: this.removeDuplicates(suggestions)
    };
  }

  static getContext(content: string, index: number, contextLength: number = 50): string {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return content.substring(start, end).trim();
  }

  static generateSmartVariableName(context: string, placeholder: string): string {
    const contextLower = context.toLowerCase();
    
    // Smart variable naming based on context
    if (contextLower.includes('landlord') && contextLower.includes('name')) {
      return 'landlord_name';
    }
    if (contextLower.includes('tenant') && contextLower.includes('name')) {
      return 'tenant_name';
    }
    if (contextLower.includes('date') || contextLower.includes('commencement')) {
      return contextLower.includes('commencement') ? 'commencement_date' : 'date';
    }
    if (contextLower.includes('rent') || contextLower.includes('amount')) {
      return 'rent_amount';
    }
    if (contextLower.includes('address')) {
      return contextLower.includes('landlord') ? 'landlord_address' : 'address';
    }
    if (contextLower.includes('site') && contextLower.includes('location')) {
      return 'site_location';
    }
    if (contextLower.includes('title') && contextLower.includes('number')) {
      return 'title_number';
    }

    // Generate sequential variable names as fallback
    return `field_${Math.random().toString(36).substr(2, 6)}`;
  }

  static categorizeField(context: string, text: string): string {
    const contextLower = context.toLowerCase();
    const textLower = text.toLowerCase();

    if (contextLower.includes('date') || textLower.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/)) {
      return 'date';
    }
    if (contextLower.includes('name') || textLower.match(/^[a-z]+ [a-z]+$/i)) {
      return 'name';
    }
    if (contextLower.includes('amount') || contextLower.includes('rent') || textLower.match(/^\d+/)) {
      return 'amount';
    }
    if (contextLower.includes('address') || contextLower.includes('location')) {
      return 'location';
    }
    if (contextLower.includes('reference') || contextLower.includes('ref')) {
      return 'reference';
    }
    
    return 'other';
  }

  static removeDuplicates<T extends { text?: string; originalText?: string }>(items: T[]): T[] {
    const seen = new Set();
    return items.filter(item => {
      const key = item.text || item.originalText;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static applyVariableSuggestions(
    content: string, 
    suggestions: VariableSuggestion[], 
    selectedVariables: string[]
  ): { content: string; variables: string[] } {
    let updatedContent = content;
    const appliedVariables: string[] = [];

    suggestions.forEach(suggestion => {
      if (selectedVariables.includes(suggestion.variableName)) {
        const placeholder = `{{${suggestion.variableName}}}`;
        updatedContent = updatedContent.replace(suggestion.originalText, placeholder);
        appliedVariables.push(suggestion.variableName);
      }
    });

    return {
      content: updatedContent,
      variables: appliedVariables
    };
  }

  static replacePlaceholders(
    content: string,
    mappings: Array<{ original: string; variable: string }>
  ): { content: string; variables: string[] } {
    let updatedContent = content;
    const variables: string[] = [];

    mappings.forEach(mapping => {
      if (mapping.variable.trim()) {
        const placeholder = `{{${mapping.variable}}}`;
        // Use replace with global regex instead of replaceAll for compatibility
        const escapedOriginal = mapping.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedOriginal, 'g');
        updatedContent = updatedContent.replace(regex, placeholder);
        variables.push(mapping.variable);
      }
    });

    return {
      content: updatedContent,
      variables
    };
  }

}
