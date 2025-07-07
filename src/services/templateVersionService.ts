import { supabase } from "@/integrations/supabase/client";
import { SystemTemplateService } from "./systemTemplateService";

export interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  file_data: Uint8Array;
  content_type: string;
  created_at: string;
  created_by: string | null;
  notes: string | null;
  is_current?: boolean;
}

// Helper function to convert Uint8Array to base64 for database storage
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  const chunkSize = 8192;
  let binary = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Helper function to convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    if (!base64 || base64.trim() === '') {
      console.warn('Empty base64 data provided');
      return new Uint8Array();
    }
    
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

export class TemplateVersionService {
  /**
   * Creates a new version of a template
   */
  static async createVersion(
    templateId: string, 
    fileData: Uint8Array, 
    contentType: string,
    notes?: string
  ): Promise<TemplateVersion> {
    try {
      console.log('Creating new template version for template:', templateId);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Authentication required');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get next version number
      const { data: versionData, error: versionError } = await supabase.rpc(
        'get_next_template_version',
        { template_id: templateId }
      );
      
      if (versionError) {
        console.error('Error getting next version number:', versionError);
        throw new Error('Failed to get next version number');
      }
      
      const versionNumber = versionData || 1;
      console.log('Next version number:', versionNumber);
      
      // Convert Uint8Array to base64 string for storage
      const base64Data = uint8ArrayToBase64(fileData);
      
      // Insert new version
      const { data: version, error } = await supabase
        .from('template_versions')
        .insert({
          template_id: templateId,
          version_number: versionNumber,
          file_data: base64Data,
          content_type: contentType,
          created_by: user.id,
          notes: notes || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template version:', error);
        throw new Error(`Failed to create template version: ${error.message}`);
      }

      console.log('Template version created successfully:', version.id);

      return {
        ...version,
        file_data: fileData // Return original Uint8Array
      };
    } catch (error) {
      console.error('TemplateVersionService create error:', error);
      throw error;
    }
  }

  /**
   * Gets the version history for a template
   */
  static async getVersionHistory(templateId: string): Promise<TemplateVersion[]> {
    try {
      console.log('Fetching version history for template:', templateId);
      
      const { data: versions, error } = await supabase
        .from('template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching template versions:', error);
        throw new Error(`Failed to fetch template versions: ${error.message}`);
      }

      console.log(`Fetched ${versions?.length || 0} template versions`);

      return (versions || []).map(version => {
        try {
          // Handle both string and already converted data
          let fileData: Uint8Array;
          if (typeof version.file_data === 'string') {
            fileData = base64ToUint8Array(version.file_data);
          } else {
            fileData = new Uint8Array(version.file_data || []);
          }
          
          return {
            ...version,
            file_data: fileData
          };
        } catch (decodeError) {
          console.error(`Error processing version ${version.id}:`, decodeError);
          return {
            ...version,
            file_data: new Uint8Array()
          };
        }
      });
    } catch (error) {
      console.error('TemplateVersionService getHistory error:', error);
      throw error;
    }
  }

  /**
   * Gets a specific version of a template
   */
  static async getVersion(versionId: string): Promise<TemplateVersion | null> {
    try {
      console.log('Fetching template version:', versionId);
      
      // Handle special case for current version
      if (versionId === 'current') {
        throw new Error('Use SystemTemplateService to get the current version');
      }
      
      const { data: version, error } = await supabase
        .from('template_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (error) {
        console.error('Error fetching template version:', error);
        return null;
      }

      if (!version) {
        return null;
      }

      try {
        let fileData: Uint8Array;
        if (typeof version.file_data === 'string') {
          fileData = base64ToUint8Array(version.file_data);
        } else {
          fileData = new Uint8Array(version.file_data || []);
        }
        
        return {
          ...version,
          file_data: fileData
        };
      } catch (decodeError) {
        console.error(`Error processing version ${versionId}:`, decodeError);
        return {
          ...version,
          file_data: new Uint8Array()
        };
      }
    } catch (error) {
      console.error('TemplateVersionService getVersion error:', error);
      return null;
    }
  }

  /**
   * Restores a previous version as the current version
   */
  static async restoreVersion(versionId: string): Promise<boolean> {
    try {
      console.log('Restoring template version:', versionId);
      
      // Get the version to restore
      const version = await this.getVersion(versionId);
      if (!version) {
        throw new Error('Version not found');
      }
      
      // Get the template
      const template = await SystemTemplateService.getSystemTemplateById(version.template_id);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Create a new version with the current template (for history)
      await this.createVersion(
        template.id,
        template.file_data,
        template.content_type,
        `Automatic backup before restoring version ${version.version_number}`
      );
      
      // Update the template with the version data
      await SystemTemplateService.updateSystemTemplate(template.id, {
        file_data: version.file_data,
        content_type: version.content_type,
        file_name: template.file_name // Keep the same filename
      });
      
      console.log(`Successfully restored version ${version.version_number} as current version`);
      return true;
    } catch (error) {
      console.error('TemplateVersionService restore error:', error);
      throw error;
    }
  }

  /**
   * Compares two versions of a template
   */
  static async compareVersions(
    versionId1: string, 
    versionId2: string
  ): Promise<{ added: number; removed: number; changed: number; details: string }> {
    try {
      console.log(`Comparing versions: ${versionId1} vs ${versionId2}`);
      
      // Get the first version
      let version1: TemplateVersion | null;
      if (versionId1 === 'current') {
        // Get the template from the second version
        const version2 = await this.getVersion(versionId2);
        if (!version2) {
          throw new Error('Second version not found');
        }
        
        const template = await SystemTemplateService.getSystemTemplateById(version2.template_id);
        if (!template) {
          throw new Error('Template not found');
        }
        
        version1 = {
          id: 'current',
          template_id: template.id,
          version_number: 0, // Special value for current
          file_data: template.file_data,
          content_type: template.content_type,
          created_at: template.updated_at,
          created_by: template.uploaded_by || null,
          notes: 'Current version',
          is_current: true
        };
      } else {
        version1 = await this.getVersion(versionId1);
        if (!version1) {
          throw new Error('First version not found');
        }
      }
      
      // Get the second version
      let version2: TemplateVersion | null;
      if (versionId2 === 'current') {
        const template = await SystemTemplateService.getSystemTemplateById(version1.template_id);
        if (!template) {
          throw new Error('Template not found');
        }
        
        version2 = {
          id: 'current',
          template_id: template.id,
          version_number: 0, // Special value for current
          file_data: template.file_data,
          content_type: template.content_type,
          created_at: template.updated_at,
          created_by: template.uploaded_by || null,
          notes: 'Current version',
          is_current: true
        };
      } else {
        version2 = await this.getVersion(versionId2);
        if (!version2) {
          throw new Error('Second version not found');
        }
      }
      
      // Extract text from both versions
      const text1 = await this.extractTextFromVersion(version1);
      const text2 = await this.extractTextFromVersion(version2);
      
      // Perform simple text comparison
      const lines1 = text1.split('\n');
      const lines2 = text2.split('\n');
      
      const added = lines2.filter(line => !lines1.includes(line)).length;
      const removed = lines1.filter(line => !lines2.includes(line)).length;
      const changed = Math.abs(lines2.length - lines1.length) - (added + removed);
      
      // Generate comparison details
      let details = `Comparing Version ${version1.version_number} with Version ${version2.version_number}\n\n`;
      details += `Version ${version1.version_number}: ${lines1.length} lines\n`;
      details += `Version ${version2.version_number}: ${lines2.length} lines\n\n`;
      details += `Added: ${added} lines\n`;
      details += `Removed: ${removed} lines\n`;
      details += `Changed: ${changed} lines\n\n`;
      
      // Add sample of changes
      if (added > 0) {
        details += "Sample additions:\n";
        const addedLines = lines2.filter(line => !lines1.includes(line)).slice(0, 5);
        details += addedLines.map(line => `+ ${line}`).join('\n') + '\n\n';
      }
      
      if (removed > 0) {
        details += "Sample removals:\n";
        const removedLines = lines1.filter(line => !lines2.includes(line)).slice(0, 5);
        details += removedLines.map(line => `- ${line}`).join('\n') + '\n\n';
      }
      
      return {
        added,
        removed,
        changed,
        details
      };
    } catch (error) {
      console.error('TemplateVersionService compare error:', error);
      throw error;
    }
  }

  /**
   * Downloads a specific version of a template
   */
  static async downloadVersion(version: TemplateVersion): Promise<void> {
    try {
      console.log('Downloading template version:', version.id);
      
      if (!version.file_data || version.file_data.length === 0) {
        throw new Error('No file data available for download');
      }

      // Create a fresh copy of the Uint8Array to avoid issues with detached ArrayBuffers
      const dataClone = new Uint8Array(version.file_data);
      
      // Create the blob with the proper content type and the cloned data
      const blob = new Blob([dataClone], { 
        type: version.content_type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `v${version.version_number}_${new Date().getTime()}.docx`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Template version download initiated successfully');
    } catch (error) {
      console.error('Error downloading template version:', error);
      throw new Error('Failed to download template version');
    }
  }

  /**
   * Extracts text content from a template version
   */
  private static async extractTextFromVersion(version: TemplateVersion): Promise<string> {
    try {
      // Create ArrayBuffer from Uint8Array for mammoth
      const arrayBuffer = version.file_data.buffer.slice(
        version.file_data.byteOffset,
        version.file_data.byteOffset + version.file_data.byteLength
      );
      
      // Dynamically import mammoth to ensure it loads properly
      const mammoth = await import('mammoth');
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value) {
        throw new Error('No text content extracted from document');
      }
      
      return result.value
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch (error) {
      console.error('Error extracting text from version:', error);
      return `[Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }
}