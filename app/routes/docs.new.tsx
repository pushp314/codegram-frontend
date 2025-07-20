import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";
import { ArrowLeft, Eye, Save, FileText, HelpCircle } from "lucide-react";
import { Link } from "@remix-run/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from "react-hot-toast";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  const docData = {
    title: formData.get("title"),
    description: formData.get("description"),
    content: formData.get("content"),
    tags: formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [],
    isPublic: formData.get("isPublic") === "on",
    category: formData.get("category"),
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/docs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie || "",
      },
      credentials: "include",
      body: JSON.stringify(docData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to create documentation" };
    }

    const newDoc = await response.json();
    return redirect(`/docs/${newDoc.id}`);
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function NewDoc() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState(`# Welcome to Your Documentation

## Getting Started

Start writing your documentation here using **Markdown** syntax.

### What you can do:

- **Bold text** and *italic text*
- Create [links](https://example.com)
- Add code blocks:

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

- Create lists and tables
- Add images and much more!

### Code Examples

You can include inline code like \`const x = 5\` or block code:

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("CodeGram"))
\`\`\`

### Tables

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Code highlighting | ✅ |
| Tables | ✅ |

Happy documenting! 📚
`);
  const [category, setCategory] = useState("tutorial");
  const [showPreview, setShowPreview] = useState(true);
  
  const isSubmitting = navigation.state === "submitting";

  const categories = [
    { value: "tutorial", label: "📖 Tutorial", description: "Step-by-step guides" },
    { value: "reference", label: "📋 Reference", description: "API and technical reference" },
    { value: "guide", label: "🗺️ Guide", description: "How-to guides and best practices" },
    { value: "explanation", label: "💡 Explanation", description: "Conceptual explanations" },
    { value: "changelog", label: "📝 Changelog", description: "Version updates and changes" },
    { value: "faq", label: "❓ FAQ", description: "Frequently asked questions" },
  ];

  const markdownTemplates = [
    {
      name: "API Documentation",
      content: `# API Documentation

## Overview
Brief description of your API.

## Authentication
How to authenticate with your API.

## Endpoints

### GET /api/users
Get list of users.

**Parameters:**
- \`limit\` (number): Maximum number of users to return
- \`offset\` (number): Number of users to skip

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "total": 100
}
\`\`\`

## Error Codes
| Code | Description |
|------|-------------|
| 400  | Bad Request |
| 401  | Unauthorized |
| 404  | Not Found |
`
    },
    {
      name: "Tutorial",
      content: `# How to Build Amazing Apps

## Prerequisites
- Node.js 18+
- Basic JavaScript knowledge

## Step 1: Setup
First, create a new project:

\`\`\`bash
npm create vite@latest my-app
cd my-app
npm install
\`\`\`

## Step 2: Configuration
Create a config file:

\`\`\`javascript
// config.js
export default {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
\`\`\`

## Step 3: Implementation
Now let's implement the main functionality:

\`\`\`javascript
import config from './config.js';

async function fetchData() {
  try {
    const response = await fetch(config.apiUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
\`\`\`

## Conclusion
You've successfully built your first app! 🎉
`
    }
  ];

  const insertTemplate = (template: string) => {
    setContent(template);
    toast.success('Template loaded!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/docs"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Docs</span>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Create Documentation</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    Markdown Editor
                  </h3>
                </div>
                <div className="p-6">
                  <Form method="post" className="space-y-6">
                    {actionData?.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-red-800">{actionData.error}</div>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter documentation title..."
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of your documentation..."
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Markdown Content */}
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                        Content (Markdown) *
                      </label>
                      <textarea
                        id="content"
                        name="content"
                        required
                        rows={20}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="Write your documentation in Markdown..."
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="react, tutorial, api, documentation (comma-separated)"
                      />
                    </div>

                    {/* Privacy Settings */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPublic"
                          name="isPublic"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPublic" className="ml-3 text-sm text-gray-700">
                          Make this documentation public
                        </label>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <Link
                        to="/docs"
                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={isSubmitting || !content.trim() || !title.trim()}
                        className="px-6 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSubmitting ? "Publishing..." : "Publish Documentation"}</span>
                      </button>
                    </div>
                  </Form>
                </div>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Eye className="w-5 h-5 mr-2 text-green-500" />
                      Live Preview
                    </h3>
                  </div>
                  <div className="p-6 prose prose-blue max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({ node, inline, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          ) : (
                            <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          );
                        },
                        table: ({ children }) => (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Templates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Templates</h3>
                <div className="space-y-3">
                  {markdownTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => insertTemplate(template.content)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Markdown Guide */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-blue-500" />
                  Markdown Guide
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <code className="bg-gray-100 px-2 py-1 rounded"># Heading 1</code>
                    <p className="text-gray-600 mt-1">Creates a large heading</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-2 py-1 rounded">**bold**</code>
                    <p className="text-gray-600 mt-1">Makes text bold</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-2 py-1 rounded">*italic*</code>
                    <p className="text-gray-600 mt-1">Makes text italic</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-2 py-1 rounded">`code`</code>
                    <p className="text-gray-600 mt-1">Inline code</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-2 py-1 rounded">```js<br/>code<br/>```</code>
                    <p className="text-gray-600 mt-1">Code block</p>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-2 py-1 rounded">[link](url)</code>
                    <p className="text-gray-600 mt-1">Creates a link</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📂 Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.value} className="p-2 rounded-lg hover:bg-gray-50">
                      <div className="font-medium text-gray-900">{cat.label}</div>
                      <div className="text-sm text-gray-600">{cat.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}