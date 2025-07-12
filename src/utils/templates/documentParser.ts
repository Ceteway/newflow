import mammoth from 'mammoth';

export const parseWordDocument = async (file: File): Promise<string> => {
  try {
    console.log('Parsing document:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Verify we have content
    if (arrayBuffer.byteLength === 0) {
      throw new Error('File is empty');
    }
    
    // Configure mammoth options for better parsing
    const options = {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      }),
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em"
      ],
      includeDefaultStyleMap: true,
      includeEmbeddedStyleMap: true
    };

    // Parse the document
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    console.log('Mammoth result:', result);
    
    // Check if we got any content
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('Document appears to be empty or contains no readable content');
    }

    // Clean up the HTML content
    let cleanedContent = result.value;
    
    // Remove empty paragraphs and normalize spacing
    cleanedContent = cleanedContent
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Detect and convert existing blank spaces (dots) to our blank space format
    cleanedContent = detectAndConvertBlankSpaces(cleanedContent);
    
    // If still no meaningful content, throw error
    if (cleanedContent.length < 5) {
      throw new Error('Document content is too short or contains no readable text');
    }

    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.warn('Document parsing warnings:', result.messages);
    }

    console.log('Successfully parsed document, content length:', cleanedContent.length);
    return cleanedContent;
    
  } catch (error) {
    console.error('Document parsing error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not a valid zip file') || error.message.includes('End of central directory record could not be found')) {
        throw new Error('This file is not a valid Word document. Please ensure you are uploading a .docx file.');
      } else if (error.message.includes('corrupted')) {
        throw new Error('The document appears to be corrupted. Please try with a different file.');
      } else if (error.message.includes('empty')) {
        throw new Error('The document appears to be empty. Please upload a document with content.');
      } else if (error.message.includes('Cannot read properties')) {
        throw new Error('Unable to read the document. The file may be corrupted or in an unsupported format.');
      } else {
        throw new Error(`Failed to parse document: ${error.message}`);
      }
    }
    
    throw new Error('Failed to parse Word document. Please ensure the file is a valid .docx format.');
  }
};

export const validateDocumentFile = (file: File): boolean => {
  console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);
  
  // Check file extension (most reliable for Word docs)
  const fileName = file.name.toLowerCase();
  const isDocx = fileName.endsWith('.docx');
  const isDoc = fileName.endsWith('.doc');
  
  // Check MIME type (can be unreliable)
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc (legacy)
    'application/octet-stream', // Sometimes .docx files have this type
    '' // Some browsers don't set MIME type
  ];
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  const minSize = 100; // 100 bytes minimum
  
  // Validate file extension (primary check)
  const hasValidExtension = isDocx || isDoc;
  
  // Validate MIME type (secondary check - allow if extension is valid)
  const hasValidType = allowedTypes.includes(file.type) || hasValidExtension;
  
  // Validate file size
  const hasValidSize = file.size <= maxSize && file.size >= minSize;
  
  // Additional validation for file name
  const hasValidName = file.name.length > 0 && file.name.length < 255;
  
  const isValid = hasValidExtension && hasValidType && hasValidSize && hasValidName;
  
  console.log('File validation result:', {
    hasValidExtension,
    hasValidType,
    hasValidSize,
    hasValidName,
    isValid
  });
  
  return isValid;
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove file extension and invalid characters
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  
  // Replace invalid characters with underscores
  let sanitized = nameWithoutExt.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  
  // Remove multiple consecutive underscores
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores and spaces
  sanitized = sanitized.replace(/^[_\s]+|[_\s]+$/g, '');
  
  // Ensure minimum length
  if (sanitized.length === 0) {
    sanitized = 'Untitled Document';
  }
  
  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized;
};

// Helper function to detect file type from content
export const detectFileType = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // Check for ZIP signature (which .docx files use)
        // ZIP files start with PK (0x504B)
        if (arr.length >= 4) {
          const header = Array.from(arr.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
          
          if (header.startsWith('504b')) {
            // This is a ZIP file, likely .docx
            resolve('docx');
            return;
          }
          
          // Check for legacy .doc format (OLE2 signature)
          if (header.startsWith('d0cf11e0')) {
            resolve('doc');
            return;
          }
        }
        
        // If we can't detect the format but the file has .docx extension, assume it's valid
        if (file.name.toLowerCase().endsWith('.docx')) {
          resolve('docx');
          return;
        }
        
        if (file.name.toLowerCase().endsWith('.doc')) {
          resolve('doc');
          return;
        }
        
        resolve('unknown');
      } catch (error) {
        console.error('Error detecting file type:', error);
        // If detection fails but extension is valid, assume it's correct
        if (file.name.toLowerCase().endsWith('.docx')) {
          resolve('docx');
        } else if (file.name.toLowerCase().endsWith('.doc')) {
          resolve('doc');
        } else {
          resolve('unknown');
        }
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file for type detection');
      // Fallback to extension-based detection
      if (file.name.toLowerCase().endsWith('.docx')) {
        resolve('docx');
      } else if (file.name.toLowerCase().endsWith('.doc')) {
        resolve('doc');
      } else {
        resolve('unknown');
      }
    };
    
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};

// Function to detect and convert dotted blank spaces to our format
export const detectAndConvertBlankSpaces = (content: string): string => {
  console.log('Detecting blank spaces in content...');
  
  // Pattern to match sequences of dots, underscores, or dashes that represent blank spaces
  // This will match patterns like: ........, ________, ---------, or mixed patterns
  const blankSpacePatterns = [
    // Match 3 or more consecutive dots
    /\.{3,}/g,
    // Match 3 or more consecutive underscores
    /_{3,}/g,
    // Match 3 or more consecutive dashes
    /-{3,}/g,
    // Match mixed patterns of dots, underscores, and dashes (at least 3 characters)
    /[.\-_]{3,}/g,
    // Match spaced dots like ". . . . ."
    /(\.\s*){3,}/g,
    // Match patterns with spaces between characters like "_ _ _ _"
    /(_\s*){3,}/g,
    // Match patterns like "- - - -"
    /(-\s*){3,}/g
  ];

  let processedContent = content;
  let blankSpaceCount = 0;

  // Process each pattern
  blankSpacePatterns.forEach((pattern, index) => {
    processedContent = processedContent.replace(pattern, (match) => {
      // Calculate the length of the blank space based on the matched pattern
      let length;
      
      if (match.includes(' ')) {
        // For spaced patterns, count the actual characters (not spaces)
        length = match.replace(/\s/g, '').length;
      } else {
        // For consecutive patterns, use the full length
        length = match.length;
      }
      
      // Ensure minimum length of 3 and maximum of 50
      length = Math.max(3, Math.min(50, length));
      
      blankSpaceCount++;
      const blankSpaceId = `blank-${Date.now()}-${blankSpaceCount}`;
      
      console.log(`Converting blank space pattern "${match}" to blank space with length ${length}`);
      
      // Return our standardized blank space HTML
      return `<span class="blank-space" data-id="${blankSpaceId}" data-length="${length}">${'.'.repeat(length)}</span>`;
    });
  });

  if (blankSpaceCount > 0) {
    console.log(`Converted ${blankSpaceCount} blank space patterns to editable blank spaces`);
  }

  return processedContent;
};