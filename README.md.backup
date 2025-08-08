# Roblox AI Editor

A standalone AI-powered code editor for Roblox game development, built with Electron, React, and OpenAI's GPT-4o-mini.

## Features

- **File Explorer**: Browse and organize your Roblox Lua/Luau scripts
- **Monaco Editor**: Full-featured code editor with Lua syntax highlighting
- **AI Assistant**: Get intelligent code suggestions and help with your Roblox development
- **Smart Context**: AI analyzes your project files to provide relevant suggestions
- **Real-time Editing**: Edit and save files with automatic embedding updates

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd roblox-ai-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up OpenAI API key**
   
   Create a `.env` file in the root directory:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   Or set it as an environment variable:
   ```bash
   export OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Run the Electron app**
   ```bash
   npm run electron-dev
   ```

## Usage

1. **Select Project**: Click "Select Roblox Project Folder" to choose a folder containing your `.lua` files
2. **Browse Files**: Use the file explorer to navigate your project structure
3. **Edit Code**: Open any `.lua` file to edit it in the Monaco editor
4. **AI Assistance**: Use the AI panel to ask for help with your code
5. **Save Changes**: Modified files show a save button - click it to persist changes

## AI Features

The AI assistant can help with:
- Adding new game mechanics
- Optimizing existing code
- Fixing bugs and issues
- Implementing Roblox-specific features
- Code explanations and documentation

## Project Structure

```
roblox-ai-editor/
├── electron/           # Electron main process
│   ├── main.js        # Main process entry point
│   └── preload.js     # Preload script for IPC
├── src/               # React frontend
│   ├── components/    # React components
│   ├── types.ts       # TypeScript type definitions
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # React entry point
│   └── index.css      # Global styles
├── package.json       # Dependencies and scripts
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
└── README.md          # This file
```

## Development

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run electron-dev` - Start Electron with hot reload
- `npm run build` - Build for production
- `npm run dist` - Build and package the app

### Architecture

- **Electron**: Provides the desktop app shell and file system access
- **React**: Frontend UI with TypeScript
- **Monaco Editor**: Code editing with Lua support
- **OpenAI API**: AI code generation and embeddings
- **Tailwind CSS**: Styling with custom Roblox theme

## Building for Distribution

```bash
npm run dist
```

This will create distributable packages for your platform in the `dist` folder.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

1. **OpenAI API errors**: Make sure your API key is set correctly and has sufficient credits
2. **File permission errors**: Ensure the app has permission to read/write to your project folder
3. **Monaco Editor not loading**: Check that all dependencies are installed correctly

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify your OpenAI API key is working
3. Ensure your project folder contains `.lua` files
4. Try restarting the application 