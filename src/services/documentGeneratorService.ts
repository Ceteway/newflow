import { DocumentVariable } from "@/types/database";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

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
    console.log('Generating Word document from content...');
    
    const lines = content.split('\n');
    const paragraphs: Paragraph[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        // Add empty paragraph for spacing
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 120 }
        }));
        continue;
      }

      // Detect headings (all caps lines without special characters)
      const isHeading = line.toUpperCase() === line && 
                       line.trim().length > 0 && 
                       line.trim().length < 100 &&
                       !line.includes(':') && 
                       !line.includes('_') &&
                       !line.includes('{{') &&
                       /^[A-Z\s]+$/.test(line.trim());

      // Detect signature lines
      const isSignatureLine = line.includes('_____') || 
                             line.includes('Signature:') || 
                             line.includes('Date:') ||
                             line.includes('Landlord:') || 
                             line.includes('Tenant:');

      // Detect section headers (lines ending with colon)
      const isSectionHeader = line.trim().endsWith(':') && 
                             line.trim().length < 60 &&
                             !line.includes('{{');

      if (isHeading) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: line.trim(),
            bold: true,
            size: 28 // 14pt
          })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 }
        }));
      } else if (isSectionHeader) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: line.trim(),
            bold: true,
            size: 24 // 12pt
          })],
          spacing: { before: 200, after: 100 }
        }));
      } else if (isSignatureLine) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: line,
            underline: {}
          })],
          spacing: { before: 400, after: 120 }
        }));
      } else {
        // Regular paragraph with proper line spacing
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: line,
            size: 22 // 11pt
          })],
          spacing: { after: 120 },
          alignment: line.trim().startsWith('DATED') ? 'center' : undefined
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,  // 1 inch
              bottom: 1440, // 1 inch
              left: 1440    // 1 inch
            }
          }
        },
        children: paragraphs
      }]
    });

    try {
      // Use the browser-compatible method instead of toBuffer
      const buffer = await Packer.toBlob(doc);
      const arrayBuffer = await buffer.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Error generating Word document:', error);
      throw new Error('Failed to generate Word document');
    }
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
    console.log(`Downloading document: ${filename}.${format}`);
    
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

    try {
      const blob = new Blob([processedContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = `${filename}.${fileExtension}`;
      link.style.display = 'none';
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Document download initiated successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  }
}
