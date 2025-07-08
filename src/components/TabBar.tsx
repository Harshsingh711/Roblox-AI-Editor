import React from 'react';
import { FileData } from '../types';
import { X } from 'lucide-react';

interface TabBarProps {
  openFiles: FileData[];
  activeFile: FileData | null;
  onTabSelect: (file: FileData) => void;
  onTabClose: (file: FileData) => void;
}

const TabBar: React.FC<TabBarProps> = ({ openFiles, activeFile, onTabSelect, onTabClose }) => {
  if (openFiles.length === 0) {
    return (
      <div className="bg-darker-bg border-b border-border-color px-4 py-2">
        <span className="text-gray-400 text-sm">No files open</span>
      </div>
    );
  }

  return (
    <div className="bg-darker-bg border-b border-border-color flex items-center overflow-x-auto">
      {openFiles.map((file) => (
        <div
          key={file.path}
          className={`
            flex items-center space-x-2 px-4 py-2 cursor-pointer border-r border-border-color min-w-0
            ${activeFile?.path === file.path 
              ? 'bg-dark-bg text-white' 
              : 'bg-darker-bg text-gray-400 hover:text-white hover:bg-panel-bg'
            }
          `}
          onClick={() => onTabSelect(file)}
        >
          <span className="text-sm truncate flex-1">{file.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file);
            }}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabBar; 