# Roblox AI Editor - Setup Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up OpenAI API key**
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Edit .env and add your OpenAI API key
   OPENAI_API_KEY=your_actual_api_key_here
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **In a new terminal, start Electron**
   ```bash
   npm run electron-dev
   ```

## Project Structure

```
roblox-ai-editor/
├── electron/              # Electron main process
│   ├── main.js           # Main process with IPC handlers
│   └── preload.js        # Secure API bridge
├── src/                  # React frontend
│   ├── components/       # React components
│   │   ├── FileExplorer.tsx
│   │   ├── CodeEditor.tsx
│   │   └── AIPanel.tsx
│   ├── types.ts          # TypeScript definitions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
├── sample/               # Sample Lua files for testing
│   ├── PlayerController.lua
│   └── GameManager.lua
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md             # Main documentation
```

## Key Features Implemented

### ✅ Core Infrastructure
- Electron app shell with secure IPC communication
- React + TypeScript frontend with Vite
- Monaco Editor integration for Lua code editing
- Tailwind CSS with custom Roblox theme

### ✅ File Management
- Project folder selection dialog
- File explorer with directory grouping
- File reading/writing with error handling
- Automatic file content loading

### ✅ AI Integration
- OpenAI API integration for code generation
- Embedding generation for file content
- Context-aware code suggestions
- Secure API key handling

### ✅ User Interface
- VS Code-like layout with panels
- File explorer with visual indicators
- Code editor with syntax highlighting
- AI assistant panel with prompt input
- Modern dark theme with Roblox colors

### ✅ Development Features
- Hot reload for development
- TypeScript support
- Error handling and loading states
- Sample Lua files for testing

## Usage Instructions

1. **Select a Project**: Click "Select Roblox Project Folder" and choose a folder containing `.lua` files
2. **Browse Files**: Use the file explorer to navigate your project structure
3. **Edit Code**: Click on any `.lua` file to open it in the Monaco editor
4. **AI Assistance**: Use the AI panel to ask for help with your code
5. **Save Changes**: Modified files show a save button - click it to persist changes

## AI Assistant Examples

Try these prompts in the AI panel:
- "Add a double jump mechanic to the player controller"
- "Optimize the game manager for better performance"
- "Add collision detection to the player"
- "Create a power-up system"
- "Fix any bugs in the current code"

## Troubleshooting

### Common Issues

1. **OpenAI API errors**
   - Ensure your API key is set correctly in `.env`
   - Check that you have sufficient API credits
   - Verify the API key has access to GPT-4

2. **File permission errors**
   - Make sure the app has permission to read/write to your project folder
   - Try running with elevated permissions if needed

3. **Monaco Editor not loading**
   - Check that all dependencies are installed: `npm install`
   - Clear node_modules and reinstall if needed

4. **Electron app not starting**
   - Ensure the development server is running (`npm run dev`)
   - Check that port 3000 is available
   - Try running `npm run electron-dev` instead

### Development Commands

```bash
# Start development server only
npm run dev

# Start Electron with hot reload
npm run electron-dev

# Build for production
npm run build

# Package the app
npm run dist

# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

The MVP is now functional! Here are some potential enhancements:

1. **Enhanced AI Features**
   - Better file relevance scoring using embeddings
   - Code diff generation and application
   - Multi-file code generation

2. **Editor Improvements**
   - Lua/Luau language server integration
   - Auto-completion for Roblox APIs
   - Error highlighting and linting

3. **Project Management**
   - Project templates
   - Git integration
   - File search and filtering

4. **Performance**
   - Lazy loading for large projects
   - Caching for embeddings
   - Background processing

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your OpenAI API key is working
3. Ensure your project folder contains `.lua` files
4. Try restarting the application 