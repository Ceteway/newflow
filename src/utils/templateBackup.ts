import { SystemTemplateService, SystemTemplate } from "@/services/systemTemplateService";

export interface TemplateBackup {
  timestamp: string;
  templates: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    file_name: string;
    content_type: string;
    created_at: string;
    updated_at: string;
    file_data_base64: string;
  }>;
}

export class TemplateBackupService {
  /**
   * Creates a backup of all system templates
   */
  static async createBackup(): Promise<TemplateBackup> {
    console.log('Starting system template backup...');
    
    try {
      const templates = await SystemTemplateService.getAllSystemTemplates();
      console.log(`Found ${templates.length} templates to backup`);
      
      const backupData: TemplateBackup = {
        timestamp: new Date().toISOString(),
        templates: templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          file_name: template.file_name,
          content_type: template.content_type,
          created_at: template.created_at,
          updated_at: template.updated_at,
          file_data_base64: this.uint8ArrayToBase64(template.file_data)
        }))
      };
      
      console.log('Backup data prepared successfully');
      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create template backup');
    }
  }

  /**
   * Downloads the backup as a JSON file
   */
  static downloadBackup(backup: TemplateBackup): void {
    try {
      const backupJson = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `system_templates_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Backup file downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Failed to download backup file');
    }
  }

  /**
   * Removes all system templates from the database
   */
  static async removeAllTemplates(): Promise<number> {
    console.log('Starting removal of all system templates...');
    
    try {
      const templates = await SystemTemplateService.getAllSystemTemplates();
      console.log(`Found ${templates.length} templates to remove`);
      
      let removedCount = 0;
      const errors: string[] = [];
      
      for (const template of templates) {
        try {
          await SystemTemplateService.deleteSystemTemplate(template.id);
          removedCount++;
          console.log(`Removed template: ${template.name} (${template.id})`);
        } catch (error) {
          const errorMsg = `Failed to remove template ${template.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      if (errors.length > 0) {
        console.warn(`Completed with ${errors.length} errors:`, errors);
        throw new Error(`Removed ${removedCount} templates but encountered ${errors.length} errors. Check console for details.`);
      }
      
      console.log(`Successfully removed all ${removedCount} system templates`);
      return removedCount;
    } catch (error) {
      console.error('Error removing templates:', error);
      throw error;
    }
  }

  /**
   * Verifies that all templates have been removed
   */
  static async verifyRemoval(): Promise<{ success: boolean; remainingCount: number; details: string }> {
    try {
      const remainingTemplates = await SystemTemplateService.getAllSystemTemplates();
      const remainingCount = remainingTemplates.length;
      
      if (remainingCount === 0) {
        return {
          success: true,
          remainingCount: 0,
          details: 'All system templates have been successfully removed'
        };
      } else {
        return {
          success: false,
          remainingCount,
          details: `${remainingCount} templates still remain in the system: ${remainingTemplates.map(t => t.name).join(', ')}`
        };
      }
    } catch (error) {
      return {
        success: false,
        remainingCount: -1,
        details: `Error verifying removal: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Converts Uint8Array to base64 string
   */
  private static uint8ArrayToBase64(uint8Array: Uint8Array): string {
    const chunkSize = 8192;
    let binary = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  /**
   * Converts base64 string back to Uint8Array (for restoration)
   */
  static base64ToUint8Array(base64: string): Uint8Array {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      console.error('Error decoding base64:', error);
      return new Uint8Array();
    }
  }
}