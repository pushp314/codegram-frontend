import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  theme?: 'vs-dark' | 'vs-light';
  readOnly?: boolean;
  showCopyButton?: boolean;
  showFullscreenButton?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  height = '400px',
  theme = 'vs-dark',
  readOnly = false,
  showCopyButton = true,
  showFullscreenButton = true
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure Monaco themes and languages
    monaco.editor.defineTheme('codegram-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      }
    });

    monaco.editor.setTheme('codegram-dark');
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getLanguageIcon = (lang: string) => {
    const icons: { [key: string]: string } = {
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      cpp: '⚡',
      html: '🌐',
      css: '🎨',
      sql: '🗃️',
      bash: '💻',
      json: '📝',
      yaml: '📄',
      markdown: '📚',
      go: '🐹',
      rust: '🦀',
      php: '🐘',
    };
    return icons[lang] || '📄';
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      <div className={`${isFullscreen ? 'h-screen' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <span className="mr-1">{getLanguageIcon(language)}</span>
              {language.charAt(0).toUpperCase() + language.slice(1)}
            </span>
            {value && (
              <span className="text-xs text-gray-500">
                {value.split('\n').length} lines
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showCopyButton && (
              <button
                onClick={handleCopy}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
            
            {showFullscreenButton && (
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        <Editor
          height={isFullscreen ? 'calc(100vh - 48px)' : height}
          defaultLanguage={language}
          language={language}
          value={value}
          theme="codegram-dark"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            readOnly,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            contextmenu: !readOnly,
            selectOnLineNumbers: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            unfoldOnClickAfterEndOfLine: false,
            bracketPairColorization: {
              enabled: true
            },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            },
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            accessibilitySupport: 'auto'
          }}
        />
      </div>
    </div>
  );
}