
import { DocumentVariable } from "@/types/database";
import { Document, Packer, Paragraph, TextRun } from "docx";

export interface GenerationOptions {
  format: 'text' | 'html' | 'docx';
  includeFormatting?: boolean;
}

export interface GenerationResult {
  content: string | Uint8Array;
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
        return {
          content: this.convertToHtml(processedContent),
          format: options.format
        };
      case 'docx':
        const docxBuffer = await this.generateWordDocument(processedContent);
        return {
          content: docxBuffer,
          format: options.format
        };
      case 'text':
      default:
        return {
          content: this.cleanTextFormat(processedContent),
          format: options.format
        };
    }
  }

  private static async generateWordDocument(content: string): Promise<Uint8Array> {
    // Split content into paragraphs
    const paragraphs = content.split('\n').map(line => {
      if (line.trim() === '') {
        return new Paragraph({
          children: [new TextRun({ text: "" })],
        });
      }

      // Check if line should be bold (titles, headers)
      const isBold = line.toUpperCase() === line && line.trim().length > 0 && 
                    !line.includes(':') && !line.includes('_');
      
      // Check if line is a signature line
      const isSignatureLine = line.includes('_____') || line.includes('Landlord:') || line.includes('Tenant:');

      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            bold: isBold,
            underline: isSignatureLine ? {} : undefined,
          }),
        ],
        spacing: {
          after: 120, // Add some spacing between paragraphs
        }
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  private static convertToHtml(content: string): string {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/, '<p>$1</p>')
      .replace(/<p><\/p>/g, '');
  }

  private static cleanTextFormat(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  static downloadDocument(content: string | Uint8Array, filename: string, format: 'text' | 'html' | 'docx'): void {
    let mimeType: string;
    let fileExtension: string;
    let processedContent: string | Uint8Array = content;

    switch (format) {
      case 'html':
        mimeType = 'text/html';
        fileExtension = 'html';
        if (typeof content === 'string') {
          processedContent = `<!DOCTYPE html><html><head><title>${filename}</title></head><body>${content}</body></html>`;
        }
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
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
