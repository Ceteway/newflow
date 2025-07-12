import React from 'react';
import { Database, BookTemplate as FileTemplate, Upload } from 'lucide-react';

interface TabSystemProps {
  activeTab: 'upload' | 'system' | 'templates';
  onTabChange: (tab: 'upload' | 'system' | 'templates') => void;
  systemCount: number;
  templateCount: number;
}

const TabSystem: React.FC<TabSystemProps> = ({ 
  activeTab, 
  onTabChange, 
  systemCount, 
  templateCount 
}) => {
  const tabs = [
    {
      id: 'upload' as const,
      name: 'Upload',
      icon: Upload,
      count: null
    },
    {
      id: 'system' as const,
      name: 'System Documents',
      icon: Database,
      count: systemCount
    },
    {
      id: 'templates' as const,
      name: 'User Templates',
      icon: FileTemplate,
      count: templateCount
    }
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex space-x-8 px-6">
        {tabs.map(({ id, name, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{name}</span>
            {count !== null && (
              <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabSystem;