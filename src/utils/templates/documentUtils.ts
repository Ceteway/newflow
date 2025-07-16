/**
 * Shared utilities for document processing and preview functionality
 */

/**
 * Processes document content for preview by converting blank spaces to underlined format
 * @param content HTML content with blank spaces
 * @returns Processed HTML content suitable for preview
 */
export const processContentForPreview = (content: string): string => {
  // Replace blank spaces with underlines for preview
  return content.replace(
    /<span class="blank-space"[^>]*>(.*?)<\/span>/g,
    (match, content) => {
      // Check if this is an unfilled blank space (contains only dots)
      if (content.match(/^\.+$/)) {
        // Unfilled blank space - show as underline
        const length = match.match(/data-length="(\d+)"/)?.[1] || '10';
        return `<span style="text-decoration: underline; text-decoration-style: dotted; color: #6b7280;">${'_'.repeat(parseInt(length))}</span>`;
      }
      // Filled blank space - show the content
      return content;
    }
  );
};

/**
 * Extracts plain text from HTML content for document generation
 * @param htmlContent HTML content
 * @returns Plain text content
 */
export const extractPlainTextFromHtml = (htmlContent: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Extract text content from the HTML
  let plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up the text
  plainText = plainText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return plainText;
};

/**
 * Validates if content has readable text
 * @param content Content to validate
 * @returns True if content is readable
 */
export const isContentReadable = (content: string): boolean => {
  if (!content || content.trim().length === 0) {
    return false;
  }
  
  // Check if content is just placeholder text
  const placeholderPatterns = [
    /^\[Template:.*\]$/,
    /^This document could not be previewed/,
    /^Error:/
  ];
  
  return !placeholderPatterns.some(pattern => pattern.test(content.trim()));
};

/**
 * Formats template content for display with proper styling
 * @param content Raw template content
 * @returns Formatted HTML content
 */
export const formatTemplateContent = (content: string): string => {
  // Process content for preview
  let formattedContent = processContentForPreview(content);
  
  // Add basic styling for better readability
  formattedContent = formattedContent
    .replace(/<h1>/g, '<h1 style="font-size: 1.5rem; font-weight: bold; margin: 1rem 0;">')
    .replace(/<h2>/g, '<h2 style="font-size: 1.25rem; font-weight: bold; margin: 0.75rem 0;">')
    .replace(/<h3>/g, '<h3 style="font-size: 1.125rem; font-weight: bold; margin: 0.5rem 0;">')
    .replace(/<p>/g, '<p style="margin: 0.5rem 0; line-height: 1.6;">')
    .replace(/<ul>/g, '<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">')
    .replace(/<ol>/g, '<ol style="margin: 0.5rem 0; padding-left: 1.5rem;">')
    .replace(/<li>/g, '<li style="margin: 0.25rem 0;">');
  
  return formattedContent;
};