import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useUser } from './UserContext';

export interface WorkflowInstruction {
  id: string;
  siteCode: string;
  siteName: string;
  siteLocation: string;
  landlordName: string;
  stage: 'document-drafting' | 'execution' | 'registration' | 'completed';
  progress: number;
  createdAt: string;
  lastUpdated: string;
  assignee: string;
  nextAction: string;
  priority: 'low' | 'medium' | 'high';
  formData: any;
  generatedDocuments: string[];
  auditTrail: AuditEntry[];
  progressReason?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface WorkflowContextType {
  instructions: WorkflowInstruction[];
  addInstruction: (instruction: WorkflowInstruction) => void;
  updateInstruction: (id: string, updates: Partial<WorkflowInstruction>) => void;
  updateInstructionStage: (id: string, stage: WorkflowInstruction['stage']) => void;
  addAuditEntry: (instructionId: string, entry: Omit<AuditEntry, 'id'>) => void;
  generateDocuments: (instructionId: string, templateIds: string[]) => Promise<string[]>;
  assignToUser: (instructionId: string, userId: string, role: string) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [instructions, setInstructions] = useState<WorkflowInstruction[]>([
    {
      id: "ROF-2024-001",
      siteCode: "NBI001",
      siteName: "Westlands Plaza",
      siteLocation: "Westlands, Nairobi",
      landlordName: "ABC Properties Ltd",
      stage: "document-drafting",
      progress: 35,
      createdAt: "2024-01-10",
      lastUpdated: "2024-01-15",
      assignee: "John Doe (IC)",
      nextAction: "EC Review",
      priority: "high",
      formData: {},
      generatedDocuments: [],
      auditTrail: [],
      progressReason: "Waiting for landlord to provide additional documentation"
    },
    {
      id: "ROF-2024-002",
      siteCode: "NBI002", 
      siteName: "Karen Gardens",
      siteLocation: "Karen, Nairobi",
      landlordName: "XYZ Holdings Ltd",
      stage: "execution",
      progress: 65,
      createdAt: "2024-01-08",
      lastUpdated: "2024-01-20",
      assignee: "Jane Smith (EC)",
      nextAction: "Lease Execution",
      priority: "medium",
      formData: {},
      generatedDocuments: [],
      auditTrail: []
    },
    {
      id: "ROF-2024-003",
      siteCode: "NBI003",
      siteName: "Kilimani Tower",
      siteLocation: "Kilimani, Nairobi",
      landlordName: "Prime Estates",
      stage: "registration",
      progress: 85,
      createdAt: "2024-01-05",
      lastUpdated: "2024-01-22",
      assignee: "Mike Johnson (POA)",
      nextAction: "Registration & Closure",
      priority: "low",
      formData: {},
      generatedDocuments: [],
      auditTrail: []
    },
    {
      id: "ROF-2024-004",
      siteCode: "NBI004",
      siteName: "Central Plaza",
      siteLocation: "CBD, Nairobi",
      landlordName: "Central Plaza Ltd",
      stage: "completed",
      progress: 100,
      createdAt: "2024-01-01",
      lastUpdated: "2024-01-25",
      assignee: "Admin User (Admin)",
      nextAction: "File Archived",
      priority: "low",
      formData: {},
      generatedDocuments: [],
      auditTrail: []
    }
  ]);

  const getStageProgress = (stage: WorkflowInstruction['stage']): number => {
    switch (stage) {
      case 'document-drafting': return 25;
      case 'execution': return 60;
      case 'registration': return 85;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const getNextAction = (stage: WorkflowInstruction['stage']): string => {
    switch (stage) {
      case 'document-drafting': return 'EC Review & Document Finalization';
      case 'execution': return 'Lease Execution & Signing';
      case 'registration': return 'Registration & Closure';
      case 'completed': return 'File Archived';
      default: return 'Pending Review';
    }
  };

  const addInstruction = (instruction: WorkflowInstruction) => {
    setInstructions(prev => [...prev, instruction]);
  };

  const updateInstruction = (id: string, updates: Partial<WorkflowInstruction>) => {
    setInstructions(prev => 
      prev.map(inst => 
        inst.id === id 
          ? { ...inst, ...updates, lastUpdated: new Date().toISOString().split('T')[0] }
          : inst
      )
    );
  };

  const updateInstructionStage = (id: string, stage: WorkflowInstruction['stage']) => {
    const progress = getStageProgress(stage);
    const nextAction = getNextAction(stage);
    
    updateInstruction(id, {
      stage,
      progress,
      nextAction
    });

    addAuditEntry(id, {
      action: 'Stage Updated',
      user: 'System',
      timestamp: new Date().toISOString(),
      details: `Stage changed to ${stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
    });
  };

  const addAuditEntry = (instructionId: string, entry: Omit<AuditEntry, 'id'>) => {
    const auditEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    updateInstruction(instructionId, {
      auditTrail: [...(instructions.find(i => i.id === instructionId)?.auditTrail || []), auditEntry]
    });
  };

  const assignToUser = (instructionId: string, userId: string, role: string) => {
    const instruction = instructions.find(i => i.id === instructionId);
    if (!instruction) return;

    let newStage = instruction.stage;
    let newProgress = instruction.progress;

    // Auto-advance stage based on role assignment
    if (role === 'EC' && instruction.stage === 'document-drafting') {
      newStage = 'execution';
      newProgress = 60;
    } else if (role === 'POA' && instruction.stage === 'execution') {
      newStage = 'registration';
      newProgress = 85;
    }

    updateInstruction(instructionId, {
      assignee: `${userId} (${role})`,
      stage: newStage,
      progress: newProgress,
      nextAction: getNextAction(newStage)
    });

    addAuditEntry(instructionId, {
      action: 'Assignment Updated',
      user: 'System',
      timestamp: new Date().toISOString(),
      details: `Assigned to ${userId} (${role})`
    });
  };

  const generateDocuments = async (instructionId: string, templateIds: string[]): Promise<string[]> => {
    // Simulate document generation
    const generatedDocs = templateIds.map(templateId => `${templateId}-${instructionId}.pdf`);
    
    updateInstruction(instructionId, {
      generatedDocuments: generatedDocs,
      progress: 50
    });

    addAuditEntry(instructionId, {
      action: 'Documents Generated',
      user: 'System',
      timestamp: new Date().toISOString(),
      details: `Generated ${templateIds.length} documents: ${templateIds.join(', ')}`
    });

    return generatedDocs;
  };

  return (
    <WorkflowContext.Provider value={{
      instructions,
      addInstruction,
      updateInstruction,
      updateInstructionStage,
      addAuditEntry,
      generateDocuments,
      assignToUser
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
