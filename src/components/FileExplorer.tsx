import React from 'react';
import { FileData } from '../types';
import { Folder, FileCode, Loader2 } from 'lucide-react';

interface FileExplorerProps {
  files: FileData[];
  selectedFile: FileData | null;
  onFileSelect: (file: FileData) => void;
  isLoading: boolean;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onFileSelect,
  isLoading
}) => {
  const groupFilesByDirectory = (files: FileData[]) => {
    const groups: Record<string, FileData[]> = {};
    
    files.forEach(file => {
      const dir = file.relativePath.split('/').slice(0, -1).join('/');
      const key = dir || 'root';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
    });
    
    return groups;
  };

  const fileGroups = groupFilesByDirectory(files);

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="animate-spin text-roblox-blue" />
        <span className="ml-2 text-gray-400">Loading project...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border-color">
        <h2 className="text-sm font-semibold text-white">EXPLORER</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(fileGroups).map(([directory, directoryFiles]) => (
          <div key={directory} className="mb-2">
            {directory !== 'root' && (
              <div className="flex items-center text-gray-400 text-sm mb-1 px-2 py-1">
                <Folder className="w-4 h-4 mr-1" />
                {directory}
              </div>
            )}
            
            {directoryFiles.map(file => (
              <div
                key={file.path}
                onClick={() => onFileSelect(file)}
                className={`
                  flex items-center px-2 py-1 text-sm cursor-pointer rounded
                  hover:bg-darker-bg transition-colors
                  ${selectedFile?.path === file.path ? 'bg-roblox-blue bg-opacity-20 text-roblox-blue' : 'text-gray-300'}
                `}
              >
                <FileCode className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        ))}
        
        {files.length === 0 && (
          <div className="text-center text-gray-400 text-sm p-4">
            No .lua files found
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer; 