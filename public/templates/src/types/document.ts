export interface Document {
  id: string;
  name: string;
  content: string;
  originalContent?: string;
  createdAt: Date;
  modifiedAt: Date;
  type: 'system' | 'template';
  blankSpaces: BlankSpace[];
}

export interface BlankSpace {
  id: string;
  position: number;
  length: number;
  filled: boolean;
  content?: string;
  placeholder?: string;
}

export interface DocumentState {
  systemDocuments: Document[];
  userTemplates: Document[];
  currentDocument: Document | null;
  activeTab: 'upload' | 'system' | 'templates';
  isLoading: boolean;
  error: string | null;
}