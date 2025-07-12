import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, MapPin, Edit3, Check, X } from 'lucide-react';
import { BlankSpace } from '../types/document';

interface BlankSpaceNavigatorProps {
  blankSpaces: BlankSpace[];
  onJumpToBlankSpace: (blankSpaceId: string) => void;
  onFillBlankSpace: (blankSpaceId: string, content: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const BlankSpaceNavigator: React.FC<BlankSpaceNavigatorProps> = ({
  blankSpaces,
  onJumpToBlankSpace,
  onFillBlankSpace,
  isVisible,
  onToggle
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const unfilledSpaces = blankSpaces.filter(space => !space.filled);
  const filledSpaces = blankSpaces.filter(space => space.filled);

  useEffect(() => {
    // Reset current index if it's out of bounds
    if (currentIndex >= unfilledSpaces.length && unfilledSpaces.length > 0) {
      setCurrentIndex(0);
    }
  }, [unfilledSpaces.length, currentIndex]);

  const handleEdit = (blankSpace: BlankSpace) => {
    setEditingId(blankSpace.id);
    setEditingContent(blankSpace.content || '');
  };

  const handleSaveEdit = () => {
    if (editingId && editingContent.trim()) {
      onFillBlankSpace(editingId, editingContent.trim());
    }
    setEditingId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const handleNext = () => {
    if (unfilledSpaces.length > 0) {
      const nextIndex = (currentIndex + 1) % unfilledSpaces.length;
      setCurrentIndex(nextIndex);
      onJumpToBlankSpace(unfilledSpaces[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    if (unfilledSpaces.length > 0) {
      const prevIndex = currentIndex === 0 ? unfilledSpaces.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      onJumpToBlankSpace(unfilledSpaces[prevIndex].id);
    }
  };

  const handleJumpTo = (blankSpaceId: string, index?: number) => {
    onJumpToBlankSpace(blankSpaceId);
    if (index !== undefined) {
      setCurrentIndex(index);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Show Blank Space Navigator"
      >
        <MapPin className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <h3 className="font-semibold">Blank Spaces</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-white hover:text-blue-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Controls */}
      {unfilledSpaces.length > 0 && (
        <div className="bg-blue-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-900">
              Unfilled: {currentIndex + 1} of {unfilledSpaces.length}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevious}
                disabled={unfilledSpaces.length <= 1}
                className="p-1 text-blue-600 hover:text-blue-800 disabled:text-blue-300 disabled:cursor-not-allowed"
                title="Previous blank space"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={unfilledSpaces.length <= 1}
                className="p-1 text-blue-600 hover:text-blue-800 disabled:text-blue-300 disabled:cursor-not-allowed"
                title="Next blank space"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => handleJumpTo(unfilledSpaces[currentIndex]?.id)}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Jump to Current
          </button>
        </div>
      )}

      {/* Blank Spaces List */}
      <div className="flex-1 overflow-auto">
        {blankSpaces.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No blank spaces found</p>
            <p className="text-xs text-gray-400 mt-1">
              Use "Detect Blank Spaces" to find patterns
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Unfilled Spaces */}
            {unfilledSpaces.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Unfilled ({unfilledSpaces.length})
                </h4>
                <div className="space-y-2">
                  {unfilledSpaces.map((blankSpace, index) => (
                    <div
                      key={blankSpace.id}
                      className={`p-3 border rounded-lg transition-all ${
                        index === currentIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-red-200 bg-red-50 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">
                          #{index + 1} • Length: {blankSpace.length}
                        </span>
                        <button
                          onClick={() => handleJumpTo(blankSpace.id, index)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Jump to
                        </button>
                      </div>
                      
                      {editingId === blankSpace.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            placeholder="Enter content..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={handleSaveEdit}
                              className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              <Check className="h-3 w-3 mx-auto" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                            >
                              <X className="h-3 w-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500 font-mono">
                            {'_'.repeat(Math.min(blankSpace.length, 20))}
                            {blankSpace.length > 20 && '...'}
                          </div>
                          <button
                            onClick={() => handleEdit(blankSpace)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Fill this blank space"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filled Spaces */}
            {filledSpaces.length > 0 && (
              <div className={unfilledSpaces.length > 0 ? 'mt-6' : ''}>
                <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Filled ({filledSpaces.length})
                </h4>
                <div className="space-y-2">
                  {filledSpaces.map((blankSpace, index) => (
                    <div
                      key={blankSpace.id}
                      className="p-3 border border-green-200 bg-green-50 rounded-lg hover:border-green-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">
                          #{index + 1} • Length: {blankSpace.length}
                        </span>
                        <button
                          onClick={() => handleJumpTo(blankSpace.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Jump to
                        </button>
                      </div>
                      
                      {editingId === blankSpace.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={handleSaveEdit}
                              className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              <Check className="h-3 w-3 mx-auto" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                            >
                              <X className="h-3 w-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-700 font-medium truncate mr-2">
                            "{blankSpace.content}"
                          </div>
                          <button
                            onClick={() => handleEdit(blankSpace)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                            title="Edit this content"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total blank spaces:</span>
            <span className="font-medium">{blankSpaces.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Unfilled:</span>
            <span className="font-medium text-red-600">{unfilledSpaces.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Filled:</span>
            <span className="font-medium text-green-600">{filledSpaces.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlankSpaceNavigator;