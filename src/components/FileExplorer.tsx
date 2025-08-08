import React, { useState, useCallback } from 'react';
import { FileData, FileNode } from '../types';
import { Folder, FileCode, Loader2, ChevronRight, ChevronDown } from 'lucide-react';

interface FileExplorerProps {
  tree: FileNode | null;
  selectedFile: FileData | null;
  onFileSelect: (file: FileData) => void;
  isLoading: boolean;
}

const isDirectory = (node: FileNode): node is Extract<FileNode, { type: 'directory' }> => node.type === 'directory';

const FileExplorer: React.FC<FileExplorerProps> = ({
  tree,
  selectedFile,
  onFileSelect,
  isLoading
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const handleFileClick = useCallback((node: Extract<FileNode, { type: 'file' }>) => {
    try {
      // Add safety checks to ensure all required properties exist
      if (!node || !node.name || !node.path || node.relativePath === undefined) {
        console.error('Invalid file node:', node);
        return;
      }
      
      onFileSelect({ 
        name: node.name, 
        path: node.path, 
        relativePath: node.relativePath 
      });
    } catch (error) {
      console.error('Error handling file click:', error);
    }
  }, [onFileSelect]);

  const renderNode = (node: FileNode, depth = 0) => {
    // Add safety check for node
    if (!node) {
      console.error('renderNode called with null/undefined node');
      return null;
    }

    // Additional safety checks for required properties
    if (!node.path || !node.name) {
      console.error('Node missing required properties:', node);
      return null;
    }

    const paddingLeft = 8 + depth * 12; // visual indent

    if (isDirectory(node)) {
      // Safety check for children array
      if (!Array.isArray(node.children)) {
        console.error('Directory node missing children array:', node);
        return null;
      }

      const isOpen = expanded.has(node.path) || depth === 0; // root open by default
      return (
        <div key={node.path}>
          <div
            className="flex items-center text-gray-400 text-sm px-2 py-1 hover:bg-darker-bg cursor-pointer select-none"
            style={{ paddingLeft }}
            onClick={() => toggle(node.path)}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 mr-1 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1 flex-shrink-0" />
            )}
            <Folder className="w-4 h-4 mr-2" />
            <span className="truncate">{node.name}</span>
          </div>
          {isOpen && node.children.map(child => renderNode(child, depth + 1))}
        </div>
      );
    }

    const isActive = selectedFile?.path === node.path;
    return (
      <div
        key={node.path}
        onClick={() => handleFileClick(node)}
        className={`flex items-center px-2 py-1 text-sm cursor-pointer rounded hover:bg-darker-bg transition-colors ${isActive ? 'bg-roblox-blue bg-opacity-20 text-roblox-blue' : 'text-gray-300'}`}
        style={{ paddingLeft }}
      >
        <FileCode className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>
    );
  };

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
        {tree ? renderNode(tree, 0) : (
          <div className="text-center text-gray-400 text-sm p-4">No files found</div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer; 