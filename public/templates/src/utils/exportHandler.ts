import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Document } from '../types/document';

export const exportToWord = async (document: Document): Promise<void> => {
  try {
    // Convert HTML to plain text and create paragraphs
    const cleanContent = stripHtml(document.content);
    const paragraphs = cleanContent.split('\n').map(text => 
      new Paragraph({
        children: [new TextRun(text || ' ')],
        alignment: AlignmentType.JUSTIFIED
      })
    );

    const doc = new DocxDocument({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${document.name}.docx`);
  } catch (error) {
    throw new Error('Failed to export document');
  }
};

const stripHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Replace blank spaces with actual spaces
  const blankSpaces = div.querySelectorAll('.blank-space');
  blankSpaces.forEach(span => {
    const content = span.textContent || '';
    if (content.includes('.')) {
      span.textContent = ' '.repeat(parseInt(span.getAttribute('data-length') || '10'));
    }
  });
  
  return div.textContent || div.innerText || '';
};