import { useState } from 'react';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import AIPanel from './components/AIPanel';
import TitleBar from './components/TitleBar';
import TabBar from './components/TabBar';
import { FileData, FileOperation, FileNode } from './types';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      listFiles: (folderPath: string) => Promise<FileData[]>;
      listDirectoryTree: (folderPath: string) => Promise<FileNode>;
      createFile: (filePath: string, content?: string) => Promise<boolean>;
      deleteFile: (filePath: string) => Promise<boolean>;
      createDirectory: (dirPath: string) => Promise<boolean>;
      deleteDirectory: (dirPath: string) => Promise<boolean>;
      fileExists: (filePath: string) => Promise<boolean>;
      directoryExists: (dirPath: string) => Promise<boolean>;
      applyFileOperations: (projectPath: string, operations: FileOperation[]) => Promise<boolean>;
      generateEmbeddings: (files: { path: string; content: string }[]) => Promise<any[]>;
      generateCode: (prompt: string, relevantFiles: { path: string; content: string }[]) => Promise<string>;
      cosineSimilarity: (vecA: number[], vecB: number[]) => number;
    };
  }
}

function App() {
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileData[]>([]); // Lua files for AI context
  const [fileTree, setFileTree] = useState<FileNode | null>(null); // Full tree for explorer
  const [openFiles, setOpenFiles] = useState<FileData[]>([]);
  const [activeFile, setActiveFile] = useState<FileData | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProject = async (path: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Load tree for UI
      const tree = await window.electronAPI.listDirectoryTree(path);
      setFileTree(tree);

      // Load .lua files for AI context only (kept for existing features)
      const projectFiles = await window.electronAPI.listFiles(path);
      setFiles(projectFiles);
      setProjectPath(path);

      // Lazy strategy: do not pre-load all contents; keep previously loaded contents
    } catch (error) {
      console.error('Error loading project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load project: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = async () => {
    try {
      setError(null);
      const path = await window.electronAPI.selectFolder();
      if (path) {
        await loadProject(path);
      }
    } catch (error) {
      console.error('Error selecting project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to select project: ${errorMessage}`);
    }
  };

  const handleFileSelect = async (file: FileData) => {
    // Open file in tabs
    if (!openFiles.find(f => f.path === file.path)) {
      setOpenFiles(prev => [...prev, file]);
    }
    setActiveFile(file);

    // Lazy-load content if not already cached
    if (!fileContents[file.path]) {
      try {
        const content = await window.electronAPI.readFile(file.path);
        setFileContents(prev => ({ ...prev, [file.path]: content }));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setFileContents(prev => ({ ...prev, [file.path]: `// Error reading file: ${message}` }));
      }
    }
  };

  const handleTabSelect = (file: FileData) => {
    setActiveFile(file);
  };

  const handleTabClose = (file: FileData) => {
    setOpenFiles(prev => prev.filter(f => f.path !== file.path));
    if (activeFile?.path === file.path) {
      const remainingFiles = openFiles.filter(f => f.path !== file.path);
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null);
    }
  };

  const handleFileSave = async (filePath: string, content: string) => {
    try {
      await window.electronAPI.writeFile(filePath, content);
      setFileContents(prev => ({ ...prev, [filePath]: content }));
      // Optional embeddings update is skipped
    } catch (error) {
      console.error('Error saving file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to save file: ${errorMessage}`);
    }
  };

  // Update file content in state
  const updateFileContent = (filePath: string, content: string) => {
    setFileContents(prev => ({ ...prev, [filePath]: content }));
  };

  // Handle file operations (create, modify, delete)
  const handleFileOperations = async (operations: FileOperation[]) => {
    try {
      setError(null);
      await window.electronAPI.applyFileOperations(projectPath || '', operations);
      if (projectPath) {
        await loadProject(projectPath);
      }
      return true;
    } catch (error) {
      console.error('Error handling file operations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to apply file operations: ${errorMessage}`);
      throw error;
    }
  };

  const findRelevantFiles = (prompt: string): { path: string; content: string }[] => {
    // Add safety check for prompt
    if (!prompt || typeof prompt !== 'string') {
      console.warn('findRelevantFiles called with invalid prompt:', prompt);
      return [];
    }

    console.log('findRelevantFiles called with prompt:', prompt);
    console.log('files array:', files);
    console.log('fileContents:', fileContents);

    const relevantFiles = files.filter(file => {
      const content = fileContents[file.path] || '';
      console.log(`Checking file ${file.path}, content length:`, content.length);
      
      const keywords = prompt.toLowerCase().split(' ');
      console.log('Keywords:', keywords);
      
      return keywords.some(keyword => 
        content.toLowerCase().includes(keyword) ||
        file.name.toLowerCase().includes(keyword)
      );
    });
    
    console.log('Relevant files found:', relevantFiles.length);
    
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
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-500 rounded text-red-200 text-sm">
              {error}
            </div>
          )}
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

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900 bg-opacity-30 border-b border-red-500 p-3">
          <div className="flex items-center justify-between">
            <span className="text-red-200 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content with resizable panels */}
      <PanelGroup direction="horizontal">
        {/* File Explorer Panel */}
        <Panel defaultSize={18} minSize={10} maxSize={40} className="!overflow-hidden">
          <FileExplorer
            tree={fileTree}
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
            fileContent={activeFile ? (fileContents[activeFile.path] || '') : ''}
            updateFileContent={updateFileContent}
            onFileOperations={handleFileOperations}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App; 