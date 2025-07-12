import React, { useState, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, Eye, Plus, Minus, Type, Search, MapPin } from 'lucide-react';
import { Document } from '../types/document';
import { insertBlankSpace, extractBlankSpaces, detectExistingBlankSpaces, fillBlankSpace } from '../utils/blankSpaceManager';
import { detectAndConvertBlankSpaces } from '../utils/documentParser';
import BlankSpaceNavigator from './BlankSpaceNavigator';

interface DocumentEditorProps {
  document: Document;
  onSave: (document: Document) => void;
  onPreview: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document, onSave, onPreview }) => {
  const [content, setContent] = useState(document.content);
  const [blankSpaceLength, setBlankSpaceLength] = useState(10);
  const [isModified, setIsModified] = useState(false);
  const [detectedSpaces, setDetectedSpaces] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);
  const [currentBlankSpaces, setCurrentBlankSpaces] = useState(extractBlankSpaces(document.content));

  useEffect(() => {
    setContent(document.content);
    setIsModified(false);
    
    // Count existing blank spaces
    const existingSpaces = detectExistingBlankSpaces(document.content);
    setCurrentBlankSpaces(existingSpaces);
    setDetectedSpaces(existingSpaces.length);
  }, [document]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setIsModified(true);
    
    // Update blank spaces list
    const updatedSpaces = detectExistingBlankSpaces(value);
    setCurrentBlankSpaces(updatedSpaces);
  }, []);

  const handleInsertBlankSpace = useCallback(() => {
    const quill = (document.querySelector('.ql-editor') as any)?.__quill;
    if (quill) {
      const range = quill.getSelection();
      const position = range ? range.index : content.length;
      
      const { content: newContent, blankSpace } = insertBlankSpace(content, position, blankSpaceLength);
      setContent(newContent);
      setIsModified(true);
    }
  }, [content, blankSpaceLength]);

  const handleDetectBlankSpaces = useCallback(() => {
    const convertedContent = detectAndConvertBlankSpaces(content);
    if (convertedContent !== content) {
      setContent(convertedContent);
      setIsModified(true);
      
      // Update detected spaces count
      const newSpaces = detectExistingBlankSpaces(convertedContent);
      setCurrentBlankSpaces(newSpaces);
      setDetectedSpaces(newSpaces.length);
      
      // Show success message or notification
      console.log(`Detected and converted blank spaces. Total: ${newSpaces.length}`);
    }
  }, [content]);

  const handleSave = useCallback(() => {
    const blankSpaces = extractBlankSpaces(content);
    const updatedDocument: Document = {
      ...document,
      content,
      blankSpaces,
      modifiedAt: new Date(),
      type: 'template'
    };
    onSave(updatedDocument);
    setIsModified(false);
  }, [document, content, onSave]);

  const handleJumpToBlankSpace = useCallback((blankSpaceId: string) => {
    const quill = (document.querySelector('.ql-editor') as any)?.__quill;
    if (quill) {
      // Find the blank space element in the editor
      const blankSpaceElement = document.querySelector(`[data-id="${blankSpaceId}"]`);
      if (blankSpaceElement) {
        // Scroll the element into view
        blankSpaceElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Highlight the element temporarily
        blankSpaceElement.classList.add('highlight-blank-space');
        setTimeout(() => {
          blankSpaceElement.classList.remove('highlight-blank-space');
        }, 2000);
        
        // Try to focus on the blank space for editing
        const range = document.createRange();
        range.selectNodeContents(blankSpaceElement);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, []);

  const handleFillBlankSpace = useCallback((blankSpaceId: string, newContent: string) => {
    const updatedContent = fillBlankSpace(content, blankSpaceId, newContent);
    setContent(updatedContent);
    setIsModified(true);
    
    // Update blank spaces list
    const updatedSpaces = detectExistingBlankSpaces(updatedContent);
    setCurrentBlankSpaces(updatedSpaces);
  }, [content]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent', 'link', 'image', 'align', 'color',
    'background', 'size', 'font', 'script', 'direction'
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">{document.name}</h2>
          {isModified && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNavigator(!showNavigator)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
              showNavigator
                ? 'border-blue-500 text-blue-700 bg-blue-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Navigator
            {currentBlankSpaces.filter(s => !s.filled).length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                {currentBlankSpaces.filter(s => !s.filled).length}
              </span>
            )}
          </button>
          
          <button
            onClick={onPreview}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </button>
          
          <button
            onClick={handleSave}
            disabled={!isModified}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              document.type === 'system' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Save className="h-4 w-4 mr-2" />
            {document.type === 'system' ? 'Save as Template' : 'Save'}
          </button>
        </div>
      </div>

      {/* Blank Space Controls */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDetectBlankSpaces}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                title="Scan document for dotted patterns (....) and convert them to editable blank spaces"
              >
                <Search className="h-4 w-4 mr-2" />
                Detect Blank Spaces
              </button>
              
              {detectedSpaces > 0 && (
                <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                  {detectedSpaces} blank space{detectedSpaces !== 1 ? 's' : ''} detected
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="blank-length" className="text-sm font-medium text-gray-700">
              New Blank Length:
            </label>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setBlankSpaceLength(Math.max(1, blankSpaceLength - 1))}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                id="blank-length"
                type="number"
                value={blankSpaceLength}
                onChange={(e) => setBlankSpaceLength(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border border-gray-300 rounded-md px-2 py-1 text-sm"
                min="1"
                max="50"
              />
              <button
                onClick={() => setBlankSpaceLength(Math.min(50, blankSpaceLength + 1))}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInsertBlankSpace}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Type className="h-4 w-4 mr-2" />
              Insert Blank Space
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>
              <strong>Tip:</strong> Use "Detect Blank Spaces" to automatically find patterns like 
              <code className="mx-1 px-1 bg-gray-200 rounded">........</code>, 
              <code className="mx-1 px-1 bg-gray-200 rounded">______</code>, or 
              <code className="mx-1 px-1 bg-gray-200 rounded">------</code> 
              and convert them to editable blank spaces.
            </p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className={`flex-1 overflow-hidden ${showNavigator ? 'mr-80' : ''} transition-all duration-300`}>
        <ReactQuill
          value={content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          className="h-full"
          style={{ height: 'calc(100% - 42px)' }}
        />
      </div>

      {/* Blank Space Navigator */}
      <BlankSpaceNavigator
        blankSpaces={currentBlankSpaces}
        onJumpToBlankSpace={handleJumpToBlankSpace}
        onFillBlankSpace={handleFillBlankSpace}
        isVisible={showNavigator}
        onToggle={() => setShowNavigator(!showNavigator)}
      />
    </div>
  );
};

export default DocumentEditor;