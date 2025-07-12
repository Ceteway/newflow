import { BlankSpace } from '../types/document';

// Enhanced function to detect existing blank spaces in content
export const detectExistingBlankSpaces = (content: string): BlankSpace[] => {
  const blankSpaces: BlankSpace[] = [];
  
  // Pattern to match our blank space spans
  const blankSpaceRegex = /<span class="blank-space" data-id="([^"]*)" data-length="([^"]*)"[^>]*>(.*?)<\/span>/g;
  let match;

  while ((match = blankSpaceRegex.exec(content)) !== null) {
    const id = match[1];
    const length = parseInt(match[2]);
    const innerContent = match[3];
    
    // Check if the blank space is filled (doesn't contain only dots)
    const isFilled = !innerContent.match(/^\.+$/);
    
    blankSpaces.push({
      id,
      position: match.index,
      length,
      filled: isFilled,
      content: isFilled ? innerContent : undefined,
      placeholder: isFilled ? undefined : `${'_'.repeat(length)}`
    });
  }

  return blankSpaces;
};

export const insertBlankSpace = (
  content: string,
  position: number,
  length: number = 10
): { content: string; blankSpace: BlankSpace } => {
  const blankSpace: BlankSpace = {
    id: generateId(),
    position,
    length,
    filled: false,
    placeholder: `${'_'.repeat(length)}`
  };

  const blankSpaceHtml = `<span class="blank-space" data-id="${blankSpace.id}" data-length="${length}">${'.'.repeat(length)}</span>`;
  const newContent = content.slice(0, position) + blankSpaceHtml + content.slice(position);

  return { content: newContent, blankSpace };
};

export const fillBlankSpace = (
  content: string,
  blankSpaceId: string,
  text: string
): string => {
  // Create a more specific regex that preserves the span structure but updates content
  const regex = new RegExp(`(<span class="blank-space[^"]*" data-id="${blankSpaceId}"[^>]*>).*?(<\/span>)`, 'g');
  
  // Replace with the new content, adding 'filled' class if not present
  return content.replace(regex, (match, openTag, closeTag) => {
    // Add 'filled' class if not already present
    const updatedOpenTag = openTag.includes('filled') 
      ? openTag 
      : openTag.replace('class="blank-space', 'class="blank-space filled');
    
    return `${updatedOpenTag}${text}${closeTag}`;
  });
};

export const extractBlankSpaces = (content: string): BlankSpace[] => {
  // Use the enhanced detection function
  return detectExistingBlankSpaces(content);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};