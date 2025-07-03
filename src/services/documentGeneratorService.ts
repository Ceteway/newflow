
import { DocumentVariable } from "@/types/database";

export interface GenerationOptions {
  format: 'text' | 'html' | 'docx';
  includeFormatting?: boolean;
}

export interface GenerationResult {
  content: string;
  format: string;
}

export class DocumentGeneratorService {
  static async generateDocument(
    templateContent: string,
    variables: DocumentVariable[],
    options: GenerationOptions
  ): Promise<GenerationResult> {
    let processedContent = templateContent;

    // Replace variables in template
    variables.forEach(variable => {
      const placeholder = `{{${variable.key}}}`;
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedContent = processedContent.replace(regex, variable.value || `[${variable.key}]`);
    });

    // Format based on requested format
    switch (options.format) {
      case 'html':
        processedContent = this.convertToHtml(processedContent);
        break;
      case 'docx':
        processedContent = this.formatForWord(processedContent);
        break;
      case 'text':
      default:
        processedContent = this.cleanTextFormat(processedContent);
    }

    return {
      content: processedContent,
      format: options.format
    };
  }

  private static convertToHtml(content: string): string {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/, '<p>$1</p>')
      .replace(/<p><\/p>/g, '');
  }

  private static formatForWord(content: string): string {
    // Basic Word formatting - in a real app you'd use a library like docx
    return content
      .replace(/\n/g, '\r\n')
      .trim();
  }

  private static cleanTextFormat(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  static downloadDocument(content: string, filename: string, format: 'text' | 'html' | 'docx'): void {
    let mimeType: string;
    let fileExtension: string;
    let processedContent = content;

    switch (format) {
      case 'html':
        mimeType = 'text/html';
        fileExtension = 'html';
        processedContent = `<!DOCTYPE html><html><head><title>${filename}</title></head><body>${content}</body></html>`;
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'doc';
        break;
      case 'text':
      default:
        mimeType = 'text/plain';
        fileExtension = 'txt';
    }

    const blob = new Blob([processedContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
