import { SystemTemplateService, CreateSystemTemplateData } from "./systemTemplateService";
import { TemplateCategory } from "@/types/database";

export interface ImportResult {
  success: boolean;
  templateId?: string;
  name: string;
  error?: string;
}

export interface BatchImportResult {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  results: ImportResult[];
}

export interface TemplateMetadata {
  name: string;
  description?: string;
  category: TemplateCategory;
  tags?: string[];
  version?: string;
  author?: string;
}

export class TemplateImportService {
  /**
   * Imports a single template file with metadata
   */
  static async importTemplate(
    file: File, 
    metadata: TemplateMetadata
  ): Promise<ImportResult> {
    try {
      console.log(`Starting import for template: ${metadata.name}`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit');
      }
      
      // Validate file type
      if (!this.isValidTemplateFile(file)) {
        throw new Error('Invalid file type. Only .docx, .doc, and .pdf files are supported');
      }
      
      // Convert file to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      // Prepare template data
      const templateData: CreateSystemTemplateData = {
        name: metadata.name.trim(),
        description: metadata.description?.trim(),
        category: metadata.category,
        file_name: file.name,
        file_data: fileData,
        content_type: file.type || this.getContentTypeFromExtension(file.name)
      };
      
      // Upload template
      const result = await SystemTemplateService.uploadSystemTemplate(templateData);
      
      console.log(`Template imported successfully: ${result.id}`);
      
      return {
        success: true,
        templateId: result.id,
        name: metadata.name
      };
    } catch (error) {
      console.error('Template import failed:', error);
      
      return {
        success: false,
        name: metadata.name,
        error: error instanceof Error ? error.message : 'Unknown error occurred during import'
      };
    }
  }
  
  /**
   * Imports multiple template files in batch mode
   */
  static async batchImportTemplates(
    files: File[],
    defaultCategory: TemplateCategory
  ): Promise<BatchImportResult> {
    console.log(`Starting batch import of ${files.length} templates`);
    
    const results: ImportResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (const file of files) {
      try {
        // Generate metadata from filename
        const metadata = this.generateMetadataFromFile(file, defaultCategory);
        
        // Import the template
        const result = await this.importTemplate(file, metadata);
        
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
        
        results.push(result);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        
        failedCount++;
        results.push({
          success: false,
          name: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Add a small delay between uploads to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Batch import completed: ${successCount} succeeded, ${failedCount} failed`);
    
    return {
      totalFiles: files.length,
      successCount,
      failedCount,
      results
    };
  }
  
  /**
   * Extracts metadata from a template file
   */
  static async extractMetadataFromFile(file: File): Promise<TemplateMetadata | null> {
    // This would ideally use a library to extract metadata from the document
    // For now, we'll just generate basic metadata from the filename
    return this.generateMetadataFromFile(file, 'agreements');
  }
  
  /**
   * Generates basic metadata from a file
   */
  private static generateMetadataFromFile(file: File, defaultCategory: TemplateCategory): TemplateMetadata {
    // Extract name from filename (remove extension)
    const name = file.name.replace(/\.[^/.]+$/, "");
    
    // Try to determine category from filename
    let category = defaultCategory;
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('agreement') || lowerName.includes('lease') || lowerName.includes('contract')) {
      category = 'agreements';
    } else if (lowerName.includes('form') || lowerName.includes('application')) {
      category = 'forms';
    } else if (lowerName.includes('letter') || lowerName.includes('correspondence')) {
      category = 'letters';
    } else if (lowerName.includes('invoice') || lowerName.includes('bill') || lowerName.includes('payment')) {
      category = 'invoices';
    } else if (lowerName.includes('report') || lowerName.includes('analysis')) {
      category = 'reports';
    }
    
    return {
      name,
      description: `Imported from ${file.name} on ${new Date().toLocaleDateString()}`,
      category
    };
  }
  
  /**
   * Validates if a file is a supported template format
   */
  private static isValidTemplateFile(file: File): boolean {
    return (
      file.name.endsWith('.docx') || 
      file.name.endsWith('.doc') || 
      file.name.endsWith('.pdf')
    );
  }
  
  /**
   * Gets the content type based on file extension
   */
  private static getContentTypeFromExtension(filename: string): string {
    if (filename.endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (filename.endsWith('.doc')) {
      return 'application/msword';
    } else if (filename.endsWith('.pdf')) {
      return 'application/pdf';
    }
    return 'application/octet-stream';
  }
}