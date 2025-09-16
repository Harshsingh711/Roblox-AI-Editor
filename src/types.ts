export interface FileData {
  name: string;
  path: string;
  relativePath: string;
}

export interface EmbeddingData {
  file: string;
  embedding: number[];
}

export type FileOperation =
  | { type: 'create'; path: string; content?: string }
  | { type: 'modify'; path: string; content?: string }
  | { type: 'delete'; path: string }
  | { type: 'move'; from: string; to: string };

export interface FileOperationsResponse {
  operations: FileOperation[];
  description?: string;
}

export interface AIResponse {
  content?: string;
  operations?: FileOperation[];
  description?: string;
}

export interface CodeGenerationResult {
  code: string;
  explanation: string;
  filesToModify?: string[];
}

export type FileNode =
  | { type: 'directory'; name: string; path: string; relativePath: string; children: FileNode[] }
  | { type: 'file'; name: string; path: string; relativePath: string }; 