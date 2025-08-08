import React, { useState } from 'react';
import { FileData, FileOperation, AIResponse } from '../types';
import { Send, Bot, Loader2, Copy, Check, FilePlus, FileX, FileText } from 'lucide-react';

interface AIPanelProps {
  onGenerateCode: (prompt: string) => { path: string; content: string }[];
  selectedFile: FileData | null;
  fileContent: string;
  updateFileContent: (filePath: string, content: string) => void;
  onFileOperations?: (operations: FileOperation[]) => Promise<boolean>;
}

const AIPanel: React.FC<AIPanelProps> = ({ 
  onGenerateCode, 
  selectedFile, 
  fileContent, 
  updateFileContent,
  onFileOperations 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [fileOperations, setFileOperations] = useState<FileOperation[]>([]);
  const [copied, setCopied] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [operationsSuccess, setOperationsSuccess] = useState(false);

  // Parse AI response to determine if it's file operations or simple content
  const parseAIResponse = (response: string): AIResponse => {
    console.log('Raw AI response:', response);

    // Try to extract JSON from a code block first
    const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)```/i);
    let jsonString = null;
    if (jsonBlockMatch) {
      jsonString = jsonBlockMatch[1];
    } else {
      // Fallback: try to find any code block
      const codeBlockMatch = response.match(/```[a-zA-Z]*\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      }
    }

    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        console.log('Parsed JSON from code block:', parsed);
        if (parsed.operations && Array.isArray(parsed.operations)) {
          console.log('Found file operations in code block:', parsed.operations);
          return { operations: parsed.operations };
        }
      } catch (error) {
        console.log('Failed to parse extracted JSON:', error);
      }
    }

    // Fallback: try to parse the whole response as JSON
    try {
      const parsed = JSON.parse(response);
      console.log('Parsed JSON from full response:', parsed);
      if (parsed.operations && Array.isArray(parsed.operations)) {
        console.log('Found file operations in full response:', parsed.operations);
        return { operations: parsed.operations };
      }
    } catch (error) {
      console.log('Not JSON, treating as simple content:', error);
      // Not JSON, treat as simple content
    }

    return { content: response };
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return;

    try {
      setIsGenerating(true);
      setGeneratedCode('');
      setFileOperations([]);

      // Find relevant files based on prompt
      const relevantFiles = onGenerateCode(prompt);

      // Generate code using AI
      const result = await window.electronAPI.generateCode(prompt, relevantFiles);
      
      // Parse the response
      const aiResponse = parseAIResponse(result);
      console.log('Parsed AI response:', aiResponse);
      
      if (aiResponse.operations && aiResponse.operations.length > 0) {
        console.log('Setting file operations:', aiResponse.operations);
        setFileOperations(aiResponse.operations);
        setGeneratedCode('File operations generated. Review and apply below.');
      } else {
        console.log('Setting generated code content');
        setGeneratedCode(aiResponse.content || '');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('quota exceeded')) {
        setGeneratedCode('⚠️ OpenAI API quota exceeded. You can still use the editor to write and edit code manually.\n\nTo use AI features:\n1. Check your OpenAI account billing\n2. Upgrade your plan or add credits\n3. Wait for quota reset (usually monthly)\n\nFor now, try asking questions about Roblox development or use the editor features.');
      } else {
        setGeneratedCode('Error: Failed to generate code. Please check your OpenAI API key and try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleApply = async () => {
    if (!selectedFile || !generatedCode) return;
    
    // Prevent applying to file when file operations are present
    if (fileOperations.length > 0) {
      alert('⚠️ File operations are pending. Please use "Apply All File Operations" instead of "Apply to file".');
      return;
    }
    
    try {
      // Extract only the code block if present
      let code = generatedCode.trim();
      const codeBlockMatch = code.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        code = codeBlockMatch[1].trim();
      } else if (code.startsWith('```')) {
        code = code.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
      }
      await window.electronAPI.writeFile(selectedFile.path, code);
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 2000);
      // Reload the file content in the editor
      const newContent = await window.electronAPI.readFile(selectedFile.path);
      updateFileContent(selectedFile.path, newContent);
      console.log('File successfully written:', selectedFile.path);
    } catch (error) {
      alert('Failed to apply code to file.');
      console.error('Failed to write file:', error);
    }
  };

  const handleApplyOperations = async () => {
    if (!onFileOperations || fileOperations.length === 0) return;

    // Compatibility: normalize move operations with oldPath/newPath to from/to
    const normalizedOps = fileOperations.map(op => {
      if (op.type === 'move' && ((op as any).oldPath || (op as any).newPath)) {
        return {
          type: 'move',
          from: (op as any).from || (op as any).oldPath,
          to: (op as any).to || (op as any).newPath
        } as FileOperation;
      }
      return op;
    });

    // Validate operations before sending to backend
    const validOperations = normalizedOps.filter(op => {
      if (op.type === 'move') {
        return typeof (op as any).from === 'string' && typeof (op as any).to === 'string';
      }
      return typeof (op as any).path === 'string';
    }) as FileOperation[];
    if (validOperations.length !== normalizedOps.length) {
      alert('Some file operations were invalid and have been skipped.');
    }
    if (validOperations.length === 0) return;
    
    try {
      await onFileOperations(validOperations);
      setOperationsSuccess(true);
      setTimeout(() => setOperationsSuccess(false), 2000);
      setFileOperations([]);
      setGeneratedCode('');
    } catch (error) {
      alert('Failed to apply file operations.');
      console.error('Failed to apply operations:', error);
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <FilePlus className="w-4 h-4 text-green-400" />;
      case 'modify':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'delete':
        return <FileX className="w-4 h-4 text-red-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border-color">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-roblox-blue" />
          <h2 className="text-sm font-semibold text-white">AI ASSISTANT</h2>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="p-3 border-b border-border-color">
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe what you want to add or modify (e.g., 'Add a jump mechanic', 'Fix the collision detection')"
            className="w-full h-24 p-3 bg-darker-bg border border-border-color rounded text-sm text-white placeholder-gray-400 resize-none focus:outline-none focus:border-roblox-blue"
            disabled={isGenerating}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Press Cmd/Ctrl + Enter to generate
            </span>
            
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center px-3 py-2 bg-roblox-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Generated Code */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b border-border-color flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Generated Code</h3>
          {generatedCode && (
            <button
              onClick={handleCopy}
              className="flex items-center text-xs text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>

                <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-roblox-blue" />
              <span className="ml-2 text-gray-400">Generating code...</span>
            </div>
          ) : generatedCode ? (
            <div className="bg-darker-bg border border-border-color rounded p-3">
              {fileOperations.length > 0 ? (
                <div>
                  <div className="mb-3 p-2 bg-blue-900 bg-opacity-30 border border-blue-500 rounded text-xs text-blue-200">
                    ⚠️ Multiple files need to be created/modified. Use "Apply All File Operations" below.
                  </div>
                  <h4 className="text-sm font-medium text-white mb-3">File Operations:</h4>
                  <div className="space-y-2 mb-3">
                    {fileOperations.map((op, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-300 bg-dark-bg p-2 rounded">
                        {getOperationIcon(op.type)}
                        <span className="ml-2 font-mono">
                          {op.type === 'move' ? `${op.from} → ${op.to}` : (op as any).path}
                        </span>
                        <span className="ml-auto text-gray-500">{op.type}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleApplyOperations}
                    className="w-full px-4 py-2 bg-roblox-green hover:bg-green-600 text-white text-sm rounded transition-colors"
                    disabled={!onFileOperations || fileOperations.length === 0}
                  >
                    Apply All File Operations
                  </button>
                  {operationsSuccess && (
                    <div className="mt-2 text-green-400 text-xs text-center">✓ Operations applied successfully!</div>
                  )}
                </div>
              ) : (
                <div>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-72 overflow-y-auto">
                    {generatedCode}
                  </pre>
                  {selectedFile && (
                    <button
                      onClick={handleApply}
                      className="mt-3 px-4 py-2 bg-roblox-blue hover:bg-blue-600 text-white text-xs rounded transition-colors"
                      disabled={!selectedFile}
                    >
                      Apply to file
                    </button>
                  )}
                  {applySuccess && (
                    <span className="ml-3 text-green-400 text-xs">Applied!</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Ask me to help with your Roblox code!</p>
              <p className="text-xs mt-1">I can help with mechanics, optimizations, and more.</p>
            </div>
          )}
        </div>
      </div>

      {/* Context Info */}
      {selectedFile && (
        <div className="p-3 border-t border-border-color bg-darker-bg">
          <div className="text-xs text-gray-400">
            <div className="font-medium mb-1">Current File:</div>
            <div className="text-white">{selectedFile.name}</div>
            <div className="mt-1 text-gray-500">
              {(() => {
                if (fileContent === undefined || fileContent === null) {
                  console.warn('fileContent is undefined/null:', fileContent);
                  return '0 lines';
                }
                return `${fileContent.split('\n').length} lines`;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPanel; 