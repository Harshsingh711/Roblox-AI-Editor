import React, { useState, useEffect } from 'react';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import AIPanel from './components/AIPanel';
import TitleBar from './components/TitleBar';
import TabBar from './components/TabBar';
import { FileData, EmbeddingData } from './types';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      listFiles: (folderPath: string) => Promise<FileData[]>;
      generateEmbeddings: (files: { path: string; content: string }[]) => Promise<EmbeddingData[]>;
      generateCode: (prompt: string, relevantFiles: { path: string; content: string }[]) => Promise<string>;
      cosineSimilarity: (vecA: number[], vecB: number[]) => number;
    };
  }
}

function App() {
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [openFiles, setOpenFiles] = useState<FileData[]>([]);
  const [activeFile, setActiveFile] = useState<FileData | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [embeddings, setEmbeddings] = useState<EmbeddingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProject = async (path: string) => {
    try {
      setIsLoading(true);
      const projectFiles = await window.electronAPI.listFiles(path);
      setFiles(projectFiles);
      setProjectPath(path);
      
      // Load file contents
      const contents: Record<string, string> = {};
      for (const file of projectFiles) {
        contents[file.path] = await window.electronAPI.readFile(file.path);
      }
      setFileContents(contents);
      
      // Try to generate embeddings (optional - won't fail the project load)
      try {
        const filesWithContent = projectFiles.map(file => ({
          path: file.path,
          content: contents[file.path]
        }));
        
        const newEmbeddings = await window.electronAPI.generateEmbeddings(filesWithContent);
        setEmbeddings(newEmbeddings);
      } catch (embeddingError) {
        console.warn('Embeddings generation failed (this is normal if OpenAI quota is exceeded):', embeddingError);
        // Don't fail the project load - embeddings are optional
        setEmbeddings([]);
      }
      
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = async () => {
    const path = await window.electronAPI.selectFolder();
    if (path) {
      await loadProject(path);
    }
  };

  const handleFileSelect = async (file: FileData) => {
    // Add file to open files if not already open
    if (!openFiles.find(f => f.path === file.path)) {
      setOpenFiles(prev => [...prev, file]);
    }
    setActiveFile(file);
  };

  const handleTabSelect = (file: FileData) => {
    setActiveFile(file);
  };

  const handleTabClose = (file: FileData) => {
    setOpenFiles(prev => prev.filter(f => f.path !== file.path));
    
    // If we're closing the active file, switch to another open file
    if (activeFile?.path === file.path) {
      const remainingFiles = openFiles.filter(f => f.path !== file.path);
      if (remainingFiles.length > 0) {
        setActiveFile(remainingFiles[remainingFiles.length - 1]); // Switch to last tab
      } else {
        setActiveFile(null);
      }
    }
  };

  const handleFileSave = async (filePath: string, content: string) => {
    try {
      await window.electronAPI.writeFile(filePath, content);
      setFileContents(prev => ({ ...prev, [filePath]: content }));
      
      // Try to update embeddings for this file (optional)
      try {
        const newEmbeddings = await window.electronAPI.generateEmbeddings([{ path: filePath, content }]);
        setEmbeddings(prev => {
          const filtered = prev.filter(e => e.file !== filePath);
          return [...filtered, ...newEmbeddings];
        });
      } catch (embeddingError) {
        console.warn('Failed to update embeddings (this is normal if OpenAI quota is exceeded):', embeddingError);
        // Don't fail the file save - embeddings are optional
      }
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Failed to save file');
    }
  };

  // Update file content in state
  const updateFileContent = (filePath: string, content: string) => {
    setFileContents(prev => ({ ...prev, [filePath]: content }));
  };

  const findRelevantFiles = (prompt: string): { path: string; content: string }[] => {
    // Simple keyword matching for now - in a real app, you'd use the embeddings
    const relevantFiles = files.filter(file => {
      const content = fileContents[file.path] || '';
      const keywords = prompt.toLowerCase().split(' ');
      return keywords.some(keyword => 
        content.toLowerCase().includes(keyword) ||
        file.name.toLowerCase().includes(keyword)
      );
    });
    
    return relevantFiles.slice(0, 3).map(file => ({
      path: file.path,
      content: fileContents[file.path] || ''
    }));
  };

  if (!projectPath) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Roblox AI Editor</h1>
          <button
            onClick={handleSelectProject}
            className="bg-roblox-blue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Select Roblox Project Folder
          </button>
          <p className="text-gray-400 mt-4">
            Choose a folder containing your .lua files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-bg flex flex-col">
      {/* Title Bar */}
      <TitleBar projectPath={projectPath} onSelectProject={handleSelectProject} />

      {/* Main Content with resizable panels */}
      <PanelGroup direction="horizontal">
        {/* File Explorer Panel */}
        <Panel defaultSize={18} minSize={10} maxSize={40} className="!overflow-hidden">
          <FileExplorer
            files={files}
            selectedFile={activeFile}
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-border-color cursor-col-resize" />

        {/* Editor Panel */}
        <Panel defaultSize={64} minSize={20} className="flex flex-col !overflow-hidden">
          {/* Tab Bar */}
          <TabBar
            openFiles={openFiles}
            activeFile={activeFile}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
          />
          {/* Editor Area */}
          {activeFile ? (
            <CodeEditor
              file={activeFile}
              content={fileContents[activeFile.path] || ''}
              onSave={handleFileSave}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a file to start editing
            </div>
          )}
        </Panel>
        <PanelResizeHandle className="w-1 bg-border-color cursor-col-resize" />

        {/* AI Panel */}
        <Panel defaultSize={18} minSize={12} maxSize={40} className="!overflow-hidden">
          <AIPanel
            onGenerateCode={findRelevantFiles}
            selectedFile={activeFile}
            fileContent={activeFile ? fileContents[activeFile.path] : ''}
            updateFileContent={updateFileContent}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App; 