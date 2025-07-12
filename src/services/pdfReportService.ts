import { WorkflowInstruction } from "@/contexts/WorkflowContext";

// Define jsPDF interface to avoid TypeScript errors
interface jsPDFInstance {
  text: (text: string, x: number, y: number) => void;
  setFontSize: (size: number) => void;
  setFont: (fontName: string, fontStyle?: string) => void;
  addPage: () => void;
  save: (filename: string) => void;
  internal: {
    pageSize: {
      width: number;
      height: number;
    };
  };
  getTextWidth: (text: string) => number;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  rect: (x: number, y: number, width: number, height: number, style?: string) => void;
  setDrawColor: (r: number, g?: number, b?: number) => void;
  setFillColor: (r: number, g?: number, b?: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
}

declare global {
  interface Window {
    jsPDF: new () => jsPDFInstance;
  }
}

export interface ReportData {
  instructions: WorkflowInstruction[];
  dateRange: string;
  reportType: string;
  generatedAt: string;
}

export class PDFReportService {
  private static async loadJsPDF(): Promise<typeof window.jsPDF> {
    if (typeof window !== 'undefined' && window.jsPDF) {
      return window.jsPDF;
    }

    // Dynamically import jsPDF
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule;
    
    // Make it available globally for future use
    if (typeof window !== 'undefined') {
      window.jsPDF = jsPDF;
    }
    
    return jsPDF;
  }

  static async generateWorkflowReport(data: ReportData): Promise<void> {
    try {
      console.log('Generating PDF workflow report...');
      
      const jsPDF = await this.loadJsPDF();
      const doc = new jsPDF();
      
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Fanisi Flow - Workflow Report', margin, yPosition);
      yPosition += 15;

      // Report metadata
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${data.generatedAt}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Date Range: ${data.dateRange}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Report Type: ${data.reportType}`, margin, yPosition);
      yPosition += 15;

      // Summary statistics
      const totalInstructions = data.instructions.length;
      const completedInstructions = data.instructions.filter(i => i.stage === 'completed').length;
      const inProgressInstructions = data.instructions.filter(i => i.stage !== 'completed').length;
      const avgProgress = Math.round(data.instructions.reduce((sum, i) => sum + i.progress, 0) / totalInstructions);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Instructions: ${totalInstructions}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Completed: ${completedInstructions}`, margin, yPosition);
      yPosition += 7;
      doc.text(`In Progress: ${inProgressInstructions}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Average Progress: ${avgProgress}%`, margin, yPosition);
      yPosition += 15;

      // Instructions table header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Instruction Details', margin, yPosition);
      yPosition += 10;

      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const headers = ['ID', 'Location', 'Landlord', 'Stage', 'Progress', 'Priority'];
      const colWidths = [25, 45, 45, 30, 20, 20];
      let xPosition = margin;

      // Draw header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');

      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 12;

      // Table rows
      doc.setFont('helvetica', 'normal');
      data.instructions.forEach((instruction, index) => {
        if (yPosition > 270) { // Check if we need a new page
          doc.addPage();
          yPosition = 20;
        }

        xPosition = margin;
        const rowData = [
          instruction.id,
          this.truncateText(instruction.siteLocation, 20),
          this.truncateText(instruction.landlordName, 20),
          this.formatStage(instruction.stage),
          `${instruction.progress}%`,
          instruction.priority.toUpperCase()
        ];

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
        }

        rowData.forEach((data, colIndex) => {
          doc.text(data, xPosition, yPosition);
          xPosition += colWidths[colIndex];
        });
        yPosition += 10;
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} of ${pageCount} - Generated by Fanisi Flow`,
          margin,
          doc.internal.pageSize.height - 10
        );
      }

      // Save the PDF
      const filename = `Fanisi_Flow_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log('PDF report generated successfully:', filename);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  static async generateDetailedInstructionReport(instruction: WorkflowInstruction): Promise<void> {
    try {
      console.log('Generating detailed instruction PDF report...');
      
      const jsPDF = await this.loadJsPDF();
      const doc = new jsPDF();
      
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Property Instruction Report', margin, yPosition);
      yPosition += 15;

      // Instruction ID and basic info
      doc.setFontSize(14);
      doc.text(`Instruction ID: ${instruction.id}`, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Site: ${instruction.siteName} (${instruction.siteCode})`, margin, yPosition);
      yPosition += 8;
      doc.text(`Location: ${instruction.siteLocation}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Landlord: ${instruction.landlordName}`, margin, yPosition);
      yPosition += 15;

      // Status information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Status Information', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Current Stage: ${this.formatStage(instruction.stage)}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Progress: ${instruction.progress}%`, margin, yPosition);
      yPosition += 7;
      doc.text(`Priority: ${instruction.priority.toUpperCase()}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Assignee: ${instruction.assignee}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Next Action: ${instruction.nextAction}`, margin, yPosition);
      yPosition += 15;

      // Timeline
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Timeline', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Created: ${instruction.createdAt}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Last Updated: ${instruction.lastUpdated}`, margin, yPosition);
      yPosition += 15;

      // Generated documents
      if (instruction.generatedDocuments && instruction.generatedDocuments.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Generated Documents', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        instruction.generatedDocuments.forEach(docName => {
          doc.text(`• ${docName}`, margin + 5, yPosition);
          yPosition += 7;
        });
        yPosition += 8;
      }

      // Audit trail
      if (instruction.auditTrail && instruction.auditTrail.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Audit Trail', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        instruction.auditTrail.forEach(entry => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          const date = new Date(entry.timestamp).toLocaleDateString();
          doc.text(`${date} - ${entry.action} by ${entry.user}`, margin, yPosition);
          yPosition += 6;
          if (entry.details) {
            const details = doc.splitTextToSize(entry.details, pageWidth - (margin * 2) - 10);
            details.forEach((line: string) => {
              doc.text(`  ${line}`, margin + 10, yPosition);
              yPosition += 5;
            });
          }
          yPosition += 3;
        });
      }

      // Save the PDF
      const filename = `Instruction_${instruction.id}_Report.pdf`;
      doc.save(filename);
      
      console.log('Detailed instruction PDF report generated successfully:', filename);
    } catch (error) {
      console.error('Error generating detailed instruction PDF report:', error);
      throw new Error('Failed to generate detailed instruction PDF report');
    }
  }

  private static truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private static formatStage(stage: string): string {
    return stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}