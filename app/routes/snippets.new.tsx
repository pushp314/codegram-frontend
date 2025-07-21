import { useState } from 'react';
import { Code2, Eye, Monitor, Smartphone, Tablet } from 'lucide-react';

export default function CreateSnippet() {
  const [selectedType, setSelectedType] = useState<'html' | 'react' | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [code, setCode] = useState('');

  const snippetTypes = [
    {
      id: 'html',
      title: 'HTML + Tailwind CSS',
      description: 'Create beautiful UI components',
      icon: '🎨',
    },
    {
      id: 'react',
      title: 'React + Tailwind CSS',
      description: 'Build interactive React components',
      icon: '⚛️',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {!selectedType ? (
        // Type Selection Screen
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Create New Snippet</h1>
          <div className="grid gap-6">
            {snippetTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id as any)}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 transition-colors text-left"
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                <p className="text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Code Editor Screen
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-screen">
          {/* Editor Panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Code Editor</h2>
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 font-mono text-sm border border-gray-300 rounded-lg p-4"
              placeholder="Enter your code here..."
            />
          </div>

          {/* Preview Panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
            <div 
              className="border border-gray-300 rounded-lg p-4 h-96 overflow-auto"
              dangerouslySetInnerHTML={{ __html: code }}
            />
          </div>
        </div>
      )}
    </div>
  );
}