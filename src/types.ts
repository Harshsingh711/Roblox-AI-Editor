export interface FileData {
  name: string;
  path: string;
  relativePath: string;
}

export interface EmbeddingData {
  file: string;
  embedding: number[];
}

export interface CodeGenerationResult {
  code: string;
  explanation: string;
  filesToModify?: string[];
} 