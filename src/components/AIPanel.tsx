import React, { useState } from 'react';
import { FileData } from '../types';
import { Send, Bot, Loader2, Copy, Check } from 'lucide-react';

interface AIPanelProps {
  onGenerateCode: (prompt: string) => { path: string; content: string }[];
  selectedFile: FileData | null;
  fileContent: string;
}

const AIPanel: React.FC<AIPanelProps> = ({ onGenerateCode, selectedFile, fileContent }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return;

    try {
      setIsGenerating(true);
      setGeneratedCode('');

      // Find relevant files based on prompt
      const relevantFiles = onGenerateCode(prompt);

      // Generate code using AI
      const result = await window.electronAPI.generateCode(prompt, relevantFiles);
      setGeneratedCode(result);
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

        <div className="flex-1 overflow-y-auto p-3">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-roblox-blue" />
              <span className="ml-2 text-gray-400">Generating code...</span>
            </div>
          ) : generatedCode ? (
            <div className="bg-darker-bg border border-border-color rounded p-3">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {generatedCode}
              </pre>
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
              {fileContent.split('\n').length} lines
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPanel; 