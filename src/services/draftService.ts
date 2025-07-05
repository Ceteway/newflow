
import { ROF5FormData } from "@/hooks/useROF5Form";

export interface SavedDraft {
  id: string;
  name: string;
  formData: ROF5FormData;
  savedAt: string;
  lastModified: string;
}

export class DraftService {
  private static readonly STORAGE_KEY = 'rof5_drafts';

  static saveDraft(formData: ROF5FormData, name?: string): SavedDraft {
    const drafts = this.getAllDrafts();
    const timestamp = new Date().toISOString();
    
    const draftName = name || `Draft_${formData.siteCode || 'New'}_${new Date().toLocaleDateString()}`;
    
    const draft: SavedDraft = {
      id: `draft_${Date.now()}`,
      name: draftName,
      formData: { ...formData },
      savedAt: timestamp,
      lastModified: timestamp
    };

    drafts.push(draft);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    
    console.log('Draft saved:', draft.name);
    return draft;
  }

  static getAllDrafts(): SavedDraft[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading drafts:', error);
      return [];
    }
  }

  static loadDraft(draftId: string): SavedDraft | null {
    const drafts = this.getAllDrafts();
    return drafts.find(draft => draft.id === draftId) || null;
  }

  static deleteDraft(draftId: string): void {
    const drafts = this.getAllDrafts().filter(draft => draft.id !== draftId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    console.log('Draft deleted:', draftId);
  }

  static updateDraft(draftId: string, formData: ROF5FormData): SavedDraft | null {
    const drafts = this.getAllDrafts();
    const draftIndex = drafts.findIndex(draft => draft.id === draftId);
    
    if (draftIndex === -1) return null;
    
    drafts[draftIndex].formData = { ...formData };
    drafts[draftIndex].lastModified = new Date().toISOString();
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    console.log('Draft updated:', drafts[draftIndex].name);
    
    return drafts[draftIndex];
  }
}
