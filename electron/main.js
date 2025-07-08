const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const OpenAI = require('openai');

// Load environment variables from .env file
require('dotenv').config();

let mainWindow;
let openai;

// Initialize OpenAI client
function initializeOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('API Key found:', apiKey ? 'Yes' : 'No');
  if (apiKey) {
    openai = new OpenAI({ apiKey });
    console.log('OpenAI client initialized successfully');
  } else {
    console.log('No OpenAI API key found in environment variables');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    backgroundColor: '#1E1E1E'
  });

  // Load the app
  // In development, always try to load from the dev server first
  mainWindow.loadURL('http://localhost:3000');
  mainWindow.webContents.openDevTools();
  
  // Handle load errors (fallback to built files if dev server is not available)
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Dev server not available, trying to load from dist...');
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initializeOpenAI();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
});

ipcMain.handle('list-files', async (event, folderPath) => {
  try {
    const files = [];
    
    async function scanDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.name.endsWith('.lua')) {
          files.push({
            name: entry.name,
            path: fullPath,
            relativePath: path.relative(folderPath, fullPath)
          });
        }
      }
    }
    
    await scanDirectory(folderPath);
    return files;
  } catch (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
});

ipcMain.handle('generate-embeddings', async (event, files) => {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const embeddings = [];
    
    for (const file of files) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small', // Using the newer, more efficient embedding model
        input: file.content
      });
      
      embeddings.push({
        file: file.path,
        embedding: response.data[0].embedding
      });
    }
    
    return embeddings;
  } catch (error) {
    if (error.message.includes('quota') || error.message.includes('429')) {
      console.warn('OpenAI API quota exceeded, skipping embeddings generation');
      return []; // Return empty embeddings array to allow editor to work without AI
    }
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
});

ipcMain.handle('generate-code', async (event, prompt, relevantFiles) => {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const context = relevantFiles.map(file => 
      `File: ${file.path}\nContent:\n${file.content}\n`
    ).join('\n');

    const systemPrompt = `You are an expert Roblox Lua/Luau developer. You will help users with their Roblox game development by analyzing their code and providing helpful suggestions, code improvements, or new features.

When generating code:
1. Always use proper Lua/Luau syntax
2. Follow Roblox best practices
3. Include helpful comments
4. Consider performance and security
5. Provide complete, working code snippets
6. If suggesting changes to existing code, always return the full, updated file content for the relevant file, and nothing else (no explanations, no diffs, just the code).

Current project context:
${context}

User request: ${prompt}

Please return ONLY the full, updated file content for the relevant file, and nothing else.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini which is more accessible
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    return response.choices[0].message.content;
  } catch (error) {
    if (error.message.includes('quota') || error.message.includes('429')) {
      throw new Error('OpenAI API quota exceeded. Please check your billing or upgrade your plan. You can still use the editor without AI features.');
    }
    throw new Error(`Failed to generate code: ${error.message}`);
  }
}); 