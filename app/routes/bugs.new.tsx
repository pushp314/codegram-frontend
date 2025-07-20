import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState, useRef } from "react";
import { ArrowLeft, Upload, Camera, Type, AlertTriangle, Clock, Zap } from "lucide-react";
import { Link } from "@remix-run/react";
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

  const bugData = {
    title: formData.get("title"),
    content: formData.get("content"),
    priority: formData.get("priority"),
    type: formData.get("type"),
    tags: formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [],
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/bugs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie || "",
      },
      credentials: "include",
      body: JSON.stringify(bugData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to create story" };
    }

    const newBug = await response.json();
    return redirect(`/bugs/${newBug.id}`);
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function NewBug() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState("update");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const isSubmitting = navigation.state === "submitting";

  const priorities = [
    { value: "low", label: "Low Priority", icon: "🟢", description: "Minor updates" },
    { value: "medium", label: "Medium Priority", icon: "🟡", description: "Regular updates" },
    { value: "high", label: "High Priority", icon: "🟠", description: "Important updates" },
    { value: "critical", label: "Critical", icon: "🔴", description: "Urgent issues" },
  ];

  const storyTypes = [
    { value: "update", label: "📢 Update", description: "General development updates" },
    { value: "bug", label: "🐛 Bug Report", description: "Report bugs or issues" },
    { value: "feature", label: "✨ New Feature", description: "Showcase new features" },
    { value: "tip", label: "💡 Tip", description: "Share coding tips" },
    { value: "question", label: "❓ Question", description: "Ask for help" },
    { value: "achievement", label: "🏆 Achievement", description: "Celebrate milestones" },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const quickTemplates = [
    {
      title: "🐛 Found a Bug",
      content: "Just discovered an issue with... \n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\nActual behavior:",
      priority: "high",
      type: "bug"
    },
    {
      title: "✨ New Feature Complete",
      content: "Excited to announce I just finished working on... \n\nKey features:\n• \n• \n• \n\nTech stack used:",
      priority: "medium",
      type: "feature"
    },
    {
      title: "💡 Quick Tip",
      content: "Here's a quick tip I learned today...\n\nProblem:\n\nSolution:\n\nWhy it works:",
      priority: "low",
      type: "tip"
    }
  ];

  const applyTemplate = (template: any) => {
    setTitle(template.title);
    setContent(template.content);
    setPriority(template.priority);
    setType(template.type);
    toast.success('Template applied!');
  };

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
                <span>Back to Feed</span>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Share Developer Story</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                  {/* Story Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Story Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {storyTypes.map((storyType) => (
                        <label
                          key={storyType.value}
                          className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            type === storyType.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={storyType.value}
                            checked={type === storyType.value}
                            onChange={(e) => setType(e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{storyType.label}</div>
                            <div className="text-sm text-gray-500">{storyType.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Priority *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {priorities.map((priorityOption) => (
                        <label
                          key={priorityOption.value}
                          className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            priority === priorityOption.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="priority"
                            value={priorityOption.value}
                            checked={priority === priorityOption.value}
                            onChange={(e) => setPriority(e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 flex items-center">
                              <span className="mr-2">{priorityOption.icon}</span>
                              {priorityOption.label}
                            </div>
                            <div className="text-sm text-gray-500">{priorityOption.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

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
                      placeholder="What's happening in your dev journey?"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                      Story Content *
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      required
                      rows={8}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Share your story, bug report, achievement, or question..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Stories disappear after 24 hours. Be authentic and helpful!
                    </p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Image (Optional)
                    </label>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to upload an image</p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                        </div>
                      </button>
                      
                      {selectedImage && (
                        <div className="mt-4">
                          <img
                            src={selectedImage}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedImage(null)}
                            className="mt-2 text-sm text-red-600 hover:text-red-700"
                          >
                            Remove image
                          </button>
                        </div>
                      )}
                    </div>
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
                      placeholder="javascript, react, debugging, help (comma-separated)"
                    />
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
                      className="px-6 py-3 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{isSubmitting ? "Sharing..." : "Share Story"}</span>
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Templates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Templates</h3>
                <div className="space-y-3">
                  {quickTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => applyTemplate(template)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{template.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.content.substring(0, 50)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Story Guidelines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  Story Guidelines
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Stories disappear after 24 hours</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Share authentic development experiences</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Help fellow developers with your insights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Use appropriate priority levels</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Be constructive and supportive</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Priority Guide */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                  Priority Guide
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔴</span>
                    <div>
                      <div className="font-medium text-gray-900">Critical</div>
                      <div className="text-gray-600">Production bugs, security issues</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🟠</span>
                    <div>
                      <div className="font-medium text-gray-900">High</div>
                      <div className="text-gray-600">Major features, important updates</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🟡</span>
                    <div>
                      <div className="font-medium text-gray-900">Medium</div>
                      <div className="text-gray-600">Regular progress, minor issues</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🟢</span>
                    <div>
                      <div className="font-medium text-gray-900">Low</div>
                      <div className="text-gray-600">Tips, achievements, casual updates</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {['debugging', 'react', 'javascript', 'help', 'feature', 'api', 'css', 'nodejs'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const tagsInput = document.getElementById('tags') as HTMLInputElement;
                        const currentTags = tagsInput.value;
                        const newTag = currentTags ? `, ${tag}` : tag;
                        tagsInput.value = currentTags + newTag;
                      }}
                      className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full hover:bg-orange-200 transition-colors"
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