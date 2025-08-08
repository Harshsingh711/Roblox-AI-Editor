import React, { useState, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { FileData } from '../types';
import { Save } from 'lucide-react';

interface CodeEditorProps {
  file: FileData;
  content: string;
  onSave: (filePath: string, content: string) => void;
}

const detectLanguage = (filename: string): string => {
  if (!filename || typeof filename !== 'string') {
    return 'plaintext';
  }
  
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'lua':
    case 'luau':
      return 'lua';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'sh':
      return 'shell';
    case 'yml':
    case 'yaml':
      return 'yaml';
    default:
      return 'plaintext';
  }
};

const CodeEditor: React.FC<CodeEditorProps> = ({ file, content, onSave }) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isDirty, setIsDirty] = useState(false);
  const language = useMemo(() => detectLanguage(file.name), [file.name]);

  // Update editor content when switching files or when content prop changes
  useEffect(() => {
    setEditorContent(content);
    setIsDirty(false);
  }, [file.path, content]);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditorContent(newContent);
    setIsDirty(newContent !== content);
  };

  const handleSave = () => {
    onSave(file.path, editorContent);
    setIsDirty(false);
  };

  const handleEditorDidMount = (editor: any) => {
    editor.getModel()?.updateOptions({
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="bg-darker-bg border-b border-border-color px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-white">{file.name}</span>
          {isDirty && (
            <span className="text-xs text-roblox-orange">• Modified</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isDirty && (
            <button
              onClick={handleSave}
              className="flex items-center px-3 py-1 bg-roblox-green hover:bg-green-600 text-white text-sm rounded transition-colors"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          key={file.path}
          height="100%"
          defaultLanguage={language}
          value={editorContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, Courier New, monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: true,
            parameterHints: {
              enabled: true
            },
            hover: {
              enabled: true
            },
            contextmenu: true
          } as any}
        />
      </div>
    </div>
  );
};

export default CodeEditor; 