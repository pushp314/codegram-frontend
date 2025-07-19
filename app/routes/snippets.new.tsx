import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";
import { ArrowLeft, Eye, Code, Play } from "lucide-react";
import { Link } from "@remix-run/react";
import CodeEditor from "~/components/Editor/CodeEditor";
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

  const snippetData = {
    title: formData.get("title"),
    description: formData.get("description"),
    content: formData.get("content"),
    language: formData.get("language"),
    tags: formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [],
    isPublic: formData.get("isPublic") === "on",
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/snippets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie || "",
      },
      credentials: "include",
      body: JSON.stringify(snippetData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to create snippet" };
    }

    const newSnippet = await response.json();
    return redirect(`/snippets/${newSnippet.id}`);
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function NewSnippet() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [showPreview, setShowPreview] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const isSubmitting = navigation.state === "submitting";

  const handlePreview = () => {
    if (language === 'html' || language === 'css' || language === 'javascript') {
      setShowPreview(!showPreview);
    } else {
      toast.error('Preview is only available for HTML, CSS, and JavaScript');
    }
  };

  const languages = [
    { value: "javascript", label: "JavaScript", icon: "🟨" },
    { value: "typescript", label: "TypeScript", icon: "🔷" },
    { value: "python", label: "Python", icon: "🐍" },
    { value: "java", label: "Java", icon: "☕" },
    { value: "cpp", label: "C++", icon: "⚡" },
    { value: "html", label: "HTML", icon: "🌐" },
    { value: "css", label: "CSS", icon: "🎨" },
    { value: "sql", label: "SQL", icon: "🗃️" },
    { value: "bash", label: "Bash", icon: "💻" },
    { value: "json", label: "JSON", icon: "📝" },
    { value: "yaml", label: "YAML", icon: "📄" },
    { value: "markdown", label: "Markdown", icon: "📚" },
    { value: "go", label: "Go", icon: "🐹" },
    { value: "rust", label: "Rust", icon: "🦀" },
    { value: "php", label: "PHP", icon: "🐘" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/home"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Create New Snippet</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {(language === 'html' || language === 'css' || language === 'javascript') && (
                <button
                  type="button"
                  onClick={handlePreview}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                      placeholder="Enter a descriptive title for your snippet..."
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
                      placeholder="Describe what your snippet does..."
                    />
                  </div>

                  {/* Language Selection */}
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                      Language *
                    </label>
                    <select
                      id="language"
                      name="language"
                      required
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {languages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.icon} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Code Editor */}
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                      Code *
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <CodeEditor
                        value={content}
                        onChange={setContent}
                        language={language}
                        height="400px"
                        theme="vs-dark"
                      />
                    </div>
                    <input type="hidden" name="content" value={content} />
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
                      placeholder="react, hooks, javascript, tutorial (comma-separated)"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Add relevant tags to help others discover your snippet
                    </p>
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
                        Make this snippet public (visible to everyone)
                      </label>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Link
                      to="/home"
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting || !content.trim() || !title.trim()}
                      className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      <Code className="w-4 h-4" />
                      <span>{isSubmitting ? "Creating..." : "Create Snippet"}</span>
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            {showPreview && (language === 'html' || language === 'css' || language === 'javascript') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Play className="w-5 h-5 mr-2 text-green-500" />
                    Live Preview
                  </h3>
                </div>
                <div className="p-4">
                  <iframe
                    srcDoc={language === 'html' ? content : `<style>${content}</style><div>CSS Preview</div>`}
                    className="w-full h-64 border rounded-lg"
                    sandbox="allow-scripts"
                    title="Code Preview"
                  />
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Tips for Great Snippets</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Use descriptive titles that explain what the code does</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Add comments in your code to explain complex parts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Include relevant tags to improve discoverability</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Keep snippets focused on a single concept</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {['react', 'javascript', 'python', 'css', 'html', 'nodejs', 'typescript', 'api'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const tagsInput = document.getElementById('tags') as HTMLInputElement;
                        const currentTags = tagsInput.value;
                        const newTag = currentTags ? `, ${tag}` : tag;
                        tagsInput.value = currentTags + newTag;
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors"
                    >
                      #{tag}
                    </button>
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