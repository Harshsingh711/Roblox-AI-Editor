const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  listFiles: (folderPath) => ipcRenderer.invoke('list-files', folderPath),
  
  // New: list full directory tree
  listDirectoryTree: (folderPath) => ipcRenderer.invoke('list-directory-tree', folderPath),
  
  // New file management operations
  createFile: (filePath, content) => ipcRenderer.invoke('create-file', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  deleteDirectory: (dirPath) => ipcRenderer.invoke('delete-directory', dirPath),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  directoryExists: (dirPath) => ipcRenderer.invoke('directory-exists', dirPath),
  applyFileOperations: (projectPath, operations) => ipcRenderer.invoke('apply-file-operations', projectPath, operations),
  
  // AI operations
  generateEmbeddings: (files) => ipcRenderer.invoke('generate-embeddings', files),
  generateCode: (prompt, relevantFiles) => ipcRenderer.invoke('generate-code', prompt, relevantFiles),
  
  // Utility functions
  cosineSimilarity: (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}); 