import React from 'react';

interface TitleBarProps {
  projectPath: string | null;
  onSelectProject: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ projectPath, onSelectProject }) => {
  return (
    <div 
      className="bg-darker-bg border-b border-border-color flex items-center justify-between title-bar-draggable" 
      style={{ height: '44px' }}
    >
      {/* Left side - Title and project path */}
      <div className="flex items-center space-x-4 px-4 flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-white whitespace-nowrap">Roblox AI Editor</h1>
        {projectPath && (
          <span className="text-gray-400 text-xs truncate">{projectPath}</span>
        )}
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center space-x-2 px-2 flex-shrink-0 title-bar-no-drag">
        <button
          onClick={onSelectProject}
          className="text-gray-400 hover:text-white transition-colors text-xs px-3 py-1 rounded hover:bg-gray-700"
        >
          Change Project
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 