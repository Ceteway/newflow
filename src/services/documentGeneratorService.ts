
import { DocumentVariable } from "@/types/database";
import mammoth from "mammoth";

export interface DocumentGenerationOptions {
  format: 'text' | 'html' | 'docx';
  includeFormatting: boolean;
}

export class DocumentGeneratorService {
  /**
   * Generate a document from template content and variables
   */
  static async generateDocument(
    templateContent: string,
    variables: DocumentVariable[],
    options: DocumentGenerationOptions = { format: 'text', includeFormatting: false }
  ): Promise<{ content: string; blob?: Blob }> {
    let content = templateContent;
    
    // Replace all variables in the content
    variables.forEach(variable => {
      const placeholder = `{{${variable.key}}}`;
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      content = content.replace(regex, variable.value || `[${variable.key}]`);
    });
    
    // Format the content based on the requested format
    if (options.format === 'html') {
      content = this.convertToHTML(content);
    } else if (options.format === 'docx') {
      const blob = await this.convertToDocx(content);
      return { content, blob };
    }
    
    return { content };
  }
  
  /**
   * Convert plain text to HTML with basic formatting
   */
  private static convertToHTML(content: string): string {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
  
  /**
   * Convert content to DOCX format
   */
  private static async convertToDocx(content: string): Promise<Blob> {
    // This is a simplified DOCX generation
    // In a real implementation, you would use a library like docx or mammoth
    const htmlContent = this.convertToHTML(content);
    
    // Create a simple DOCX-like structure
    const docxContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Generated Document</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
            p { margin: 6pt 0; }
            strong { font-weight: bold; }
            em { font-style: italic; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
    
    return new Blob([docxContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  }
  
  /**
   * Download generated document
   */
  static downloadDocument(content: string, filename: string, format: 'text' | 'html' | 'docx' = 'text'): void {
    let blob: Blob;
    let downloadFilename = filename;
    
    if (format === 'html') {
      blob = new Blob([content], { type: 'text/html' });
      downloadFilename = filename.replace(/\.[^/.]+$/, '') + '.html';
    } else if (format === 'docx') {
      // For DOCX, we create an HTML file that can be opened by Word
      const htmlContent = `
        <!DOCTYPE html>
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Document</title>
          <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotPromptForConvert/><w:DoNotShowInsertionsAndDeletions/></w:WordDocument></xml><![endif]-->
          <style>
            @page { margin: 1in; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.15; }
            p { margin: 0 0 8pt 0; }
          </style>
        </head>
        <body>
          ${content.replace(/\n/g, '<br>').replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}
        </body>
        </html>
      `;
      blob = new Blob([htmlContent], { type: 'application/msword' });
      downloadFilename = filename.replace(/\.[^/.]+$/, '') + '.doc';
    } else {
      blob = new Blob([content], { type: 'text/plain' });
      downloadFilename = filename.replace(/\.[^/.]+$/, '') + '.txt';
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  
  /**
   * Extract variables from uploaded Word document
   */
  static async extractVariablesFromWordDoc(file: File): Promise<{content: string, variables: string[]}> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const content = result.value;
      
      // Extract existing variables
      const regex = /\{\{([^}]+)\}\}/g;
      const variables = new Set<string>();
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        variables.add(match[1].trim());
      }
      
      return {
        content,
        variables: Array.from(variables)
      };
    } catch (error) {
      console.error('Error extracting from Word document:', error);
      throw new Error('Failed to extract content from Word document');
    }
  }
}
