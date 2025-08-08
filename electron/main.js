const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const OpenAI = require('openai');

// Load environment variables from .env file
require('dotenv').config();

let mainWindow;
let openai;

// Security: Validate file paths to prevent directory traversal
function validatePath(filePath, projectPath = null) {
  const normalizedPath = path.normalize(filePath);
  
  // If we have a project path, ensure the file is within the project
  if (projectPath) {
    const projectRoot = path.normalize(projectPath);
    const relativePath = path.relative(projectRoot, normalizedPath);
    
    // Check for directory traversal attempts
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Invalid path: Directory traversal not allowed');
    }
  }
  
  return normalizedPath;
}

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
    const validatedPath = validatePath(filePath);
    const content = await fs.readFile(validatedPath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    const validatedPath = validatePath(filePath);
    await fs.writeFile(validatedPath, content, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
});

// New file operation handlers
ipcMain.handle('create-file', async (event, filePath, content = '') => {
  try {
    const validatedPath = validatePath(filePath);
    // Ensure the directory exists
    const dir = path.dirname(validatedPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Create the file
    await fs.writeFile(validatedPath, content, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`Failed to create file: ${error.message}`);
  }
});

// Handle multiple file operations with proper path joining
ipcMain.handle('apply-file-operations', async (event, projectPath, operations) => {
  try {
    if (!projectPath) {
      throw new Error('Project path is required for file operations');
    }

    const validatedProjectPath = validatePath(projectPath);
    const fsExists = async (p) => {
      try { await fs.access(p); return true; } catch { return false; }
    };

    // Helper to recursively find all files in the project
    async function getAllFiles(dir) {
      let results = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(await getAllFiles(fullPath));
        } else {
          results.push(fullPath);
        }
      }
      return results;
    }

    // Helper to normalize AI-provided relative paths
    function normalizeRelativePath(projectPath, relPath) {
      if (!relPath) return relPath;
      const projectName = path.basename(projectPath);
      if (relPath.startsWith(projectName + '/')) {
        return relPath.slice(projectName.length + 1);
      }
      return relPath;
    }

    // Helper to generate default.project.json with correct mappings
    function generateDefaultProjectJson(folders) {
      // Standard Rojo mappings
      const mappings = {
        "ServerScriptService": "ServerScriptService",
        "ReplicatedStorage": "ReplicatedStorage",
        "ReplicatedStorage/Remotes": "ReplicatedStorage.Remotes",
        "StarterPlayer": "StarterPlayer",
        "StarterPlayer/StarterPlayerScripts": "StarterPlayer.StarterPlayerScripts"
      };
      // Add any additional folders from the operations
      for (const folder of folders) {
        if (!mappings[folder]) {
          // Map top-level folder to itself, subfolders to dot notation
          if (folder.includes('/')) {
            mappings[folder] = folder.replace(/\//g, '.');
          } else {
            mappings[folder] = folder;
          }
        }
      }
      return JSON.stringify({
        name: "RojoProject",
        tree: Object.fromEntries(
          Object.entries(mappings).map(([k, v]) => [k, { $className: "Folder", $path: v }])
        )
      }, null, 2);
    }

    // Collect all folders that will be created or used
    const foldersToEnsure = new Set();
    for (const op of operations) {
      if (op.type === 'move') {
        const toRel = normalizeRelativePath(validatedProjectPath, op.to);
        let dir = path.dirname(toRel);
        while (dir && dir !== '.' && !foldersToEnsure.has(dir)) {
          foldersToEnsure.add(dir);
          dir = path.dirname(dir);
        }
      } else if (op.type === 'create' || op.type === 'modify') {
        const relPath = normalizeRelativePath(validatedProjectPath, op.path);
        let dir = path.dirname(relPath);
        while (dir && dir !== '.' && !foldersToEnsure.has(dir)) {
          foldersToEnsure.add(dir);
          dir = path.dirname(dir);
        }
      } else if (op.type === 'delete') {
        // No folder creation needed
      }
    }

    // Ensure all folders exist before file operations
    for (const folder of Array.from(foldersToEnsure)) {
      const absFolder = path.join(validatedProjectPath, folder);
      if (!(await fsExists(absFolder))) {
        await fs.mkdir(absFolder, { recursive: true });
      }
    }

    // Ensure default.project.json exists in the project root
    const projectJsonPath = path.join(validatedProjectPath, 'default.project.json');
    if (!(await fsExists(projectJsonPath))) {
      const projectJsonContent = generateDefaultProjectJson(Array.from(foldersToEnsure));
      await fs.writeFile(projectJsonPath, projectJsonContent, 'utf-8');
    }

    // Get all files in the project for duplicate detection
    const allFiles = validatedProjectPath ? await getAllFiles(validatedProjectPath) : [];

    for (const operation of operations) {
      if (operation.type === 'move') {
        const fromRel = normalizeRelativePath(validatedProjectPath, operation.from);
        const toRel = normalizeRelativePath(validatedProjectPath, operation.to);
        const fromPath = path.isAbsolute(fromRel)
          ? fromRel
          : validatedProjectPath
          ? path.join(validatedProjectPath, fromRel)
          : fromRel;
        const toPath = path.isAbsolute(toRel)
          ? toRel
          : validatedProjectPath
          ? path.join(validatedProjectPath, toRel)
          : toRel;
        
        // Validate both paths
        validatePath(fromPath, validatedProjectPath);
        validatePath(toPath, validatedProjectPath);
        
        const toDir = path.dirname(toPath);
        await fs.mkdir(toDir, { recursive: true });
        await fs.rename(fromPath, toPath);
        continue;
      }

      // For all other types, use operation.path
      const relPath = normalizeRelativePath(validatedProjectPath, operation.path);
      const fullPath = path.isAbsolute(relPath)
        ? relPath
        : validatedProjectPath
        ? path.join(validatedProjectPath, relPath)
        : relPath;
      
      // Validate the path
      validatePath(fullPath, validatedProjectPath);
      
      switch (operation.type) {
        case 'create': {
          // Check for existing file with the same name elsewhere in the project
          const fileName = path.basename(fullPath);
          const existing = allFiles.find(f => path.basename(f).toLowerCase() === fileName.toLowerCase() && f !== fullPath);
          if (existing) {
            // Move the existing file to the new location instead of creating a duplicate
            const existingDir = path.dirname(fullPath);
            await fs.mkdir(existingDir, { recursive: true });
            await fs.rename(existing, fullPath);
          } else {
            // Ensure the directory exists
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, operation.content || '', 'utf-8');
          }
          break;
        }
        case 'modify':
          await fs.writeFile(fullPath, operation.content || '', 'utf-8');
          break;
        case 'delete':
          await fs.unlink(fullPath);
          break;
      }
    }
    return true;
  } catch (error) {
    throw new Error(`Failed to apply file operations: ${error.message}`);
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    throw new Error(`Failed to create directory: ${error.message}`);
  }
});

ipcMain.handle('delete-directory', async (event, dirPath) => {
  try {
    await fs.rmdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    throw new Error(`Failed to delete directory: ${error.message}`);
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('directory-exists', async (event, dirPath) => {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
});

ipcMain.handle('list-files', async (event, folderPath) => {
  try {
    const validatedPath = validatePath(folderPath);
    const files = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip hidden files and common system directories
          if (entry.name.startsWith('.') || 
              entry.name === 'node_modules' || 
              entry.name === '.git' ||
              entry.name === 'dist' ||
              entry.name === 'build') {
            continue;
          }
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.lua')) {
            files.push({
              name: entry.name,
              path: fullPath,
              relativePath: path.relative(validatedPath, fullPath)
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${dir}:`, error.message);
        // Continue scanning other directories even if one fails
      }
    }
    
    await scanDirectory(validatedPath);
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

    const systemPrompt = `You are an expert Roblox Lua/Luau developer and Rojo project architect. You will help users with their Roblox game development by analyzing their code and providing helpful suggestions, code improvements, or new features.

IMPORTANT: You must always follow Rojo best practices for folder structure and file placement:
- Scripts that affect game objects (e.g., KillBrick) must go in ServerScriptService/ (not Workspace/).
- Player input or client logic (e.g., dash mechanic, UI code) must go in StarterPlayer/StarterPlayerScripts/.
- Shared data, modules, RemoteEvents, or RemoteFunctions must go in ReplicatedStorage/Remotes/.
- If the user does not have a default.project.json in the root, generate one with correct mappings for all folders you create (ServerScriptService, ReplicatedStorage/Remotes, StarterPlayer/StarterPlayerScripts, etc.).
- If a folder like ServerScriptService, ReplicatedStorage/Remotes, or StarterPlayer/StarterPlayerScripts does not exist, include a create operation for it before creating files inside.
- Always use relative paths from the project root (never absolute paths).

You are an expert Roblox Lua/Luau developer. You will help users with their Roblox game development by analyzing their code and providing helpful suggestions, code improvements, or new features.

IMPORTANT: You can now create, modify, move/rename, and delete files to build complete features. When the user asks for something that requires multiple files or a complete feature, you should:

1. Create all necessary files with proper content
2. Modify existing files as needed
3. Move or rename files if restructuring the project (do NOT create duplicates)
4. Delete or archive files if they're no longer needed or are in the wrong place
5. Return a JSON response with file operations
6. Always specify the full relative path for each file operation (NEVER use absolute paths)
7. Before creating a new file, check if a file with the same name or purpose already exists anywhere in the project. If so, use a 'move' or 'modify' operation instead of 'create'.
8. Be explicit about file moves, overwrites, and structure reconciliation in the JSON operations. If a file should be moved, use a 'move' operation and specify both the old and new relative path. If a file is being moved to a location where a file already exists, add a 'delete' operation for the destination before moving or overwriting.
9. Always include 'delete' operations for orphans/duplicates when reorganizing the file tree, so there are no duplicates or orphans after the operations.
10. NEVER use absolute paths in the JSON operations, only relative paths from the project root.
11. Avoid creating duplicate files unless the user explicitly requests it.

CRITICAL: When modifying existing files, you MUST provide the COMPLETE updated file content, not just the changes or placeholder comments. The user expects the full, working code.

RESPONSE FORMAT:
Always respond in two parts:
1. A brief, human-readable summary of what you are changing or adding.
2. A code block labeled \`\`\`fileops containing a JSON object with all file operations (create, modify, move, delete) for all files involved.

Example for a simple modification:
Here's a summary of the changes:
- Updated jump count from 2 to 5 in DashScript.lua

\`\`\`fileops
{
  "operations": [
    {
      "type": "modify",
      "path": "StarterPlayer/StarterPlayerScripts/DashScript.lua",
      "content": "local UserInputService = game:GetService(\"UserInputService\")\nlocal Players = game:GetService(\"Players\")\nlocal player = Players.LocalPlayer\nlocal character = player.Character or player.CharacterAdded:Wait()\nlocal humanoid = character:WaitForChild(\"Humanoid\")\nlocal rootPart = character:WaitForChild(\"HumanoidRootPart\")\n\nlocal jumpCount = 5  -- Updated from 2 to 5\nlocal currentJumps = 0\nlocal canJump = true\n\nlocal function resetJumps()\n    currentJumps = 0\n    canJump = true\nend\n\nlocal function onJump()\n    if canJump and currentJumps < jumpCount then\n        currentJumps = currentJumps + 1\n        humanoid:ChangeState(Enum.HumanoidStateType.Jumping)\n        \n        if currentJumps >= jumpCount then\n            canJump = false\n        end\n    end\nend\n\nhumanoid.StateChanged:Connect(function(_, new)\n    if new == Enum.HumanoidStateType.Landed then\n        resetJumps()\n    end\nend)\n\nUserInputService.JumpRequest:Connect(onJump)"
    }
  ]
}
\`\`\`

CRITICAL: The code block must be labeled \`\`\`fileops and contain only the JSON object. Do not include any other code or explanation inside the code block. ALWAYS provide the complete, working file content in the "content" field, not placeholder comments.

This format must be used for all user prompts that result in file changes, including single-file and multi-file operations, and for any feature, fix, or refactor. The summary should be human-readable and concise, and the code block must be machine-readable and complete.

Current project context:
${context}

User request: ${prompt}

DECISION: If this is a simple modification to an existing file, return a summary and a fileops code block with a single modify operation containing the COMPLETE updated file content. If this requires creating/modifying/moving/deleting multiple files or is a complete feature request, return a summary and a fileops code block with all necessary operations.`;

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

ipcMain.handle('list-directory-tree', async (event, folderPath) => {
  try {
    const validatedRoot = validatePath(folderPath);

    async function buildTree(absPath, rootPath) {
      const name = path.basename(absPath);
      const rel = path.relative(rootPath, absPath) || '';

      // Skip hidden/system items at the top of recursion
      const base = path.basename(absPath);
      if (
        base.startsWith('.') ||
        base === 'node_modules' ||
        base === '.git' ||
        base === 'dist' ||
        base === 'build'
      ) {
        return null;
      }

      const stat = await fs.stat(absPath);
      if (stat.isDirectory()) {
        const entries = await fs.readdir(absPath, { withFileTypes: true });
        const children = [];
        for (const entry of entries) {
          // Filter here as well for nested items
          if (
            entry.name.startsWith('.') ||
            entry.name === 'node_modules' ||
            entry.name === '.git' ||
            entry.name === 'dist' ||
            entry.name === 'build'
          ) {
            continue;
          }
          const childPath = path.join(absPath, entry.name);
          const child = await buildTree(childPath, rootPath);
          if (child) children.push(child);
        }
        // Sort: directories first, then files, both alphabetically
        children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        return { 
          type: 'directory', 
          name: name || 'root', 
          path: absPath, 
          relativePath: rel, 
          children 
        };
      }
      return { 
        type: 'file', 
        name: name || 'unknown', 
        path: absPath, 
        relativePath: rel 
      };
    }

    const tree = await buildTree(validatedRoot, validatedRoot);
    return tree;
  } catch (error) {
    throw new Error(`Failed to list directory tree: ${error.message}`);
  }
}); 