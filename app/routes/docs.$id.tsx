import { LoaderFunctionArgs, json, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useActionData } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

interface Documentation {
  id: string;
  title: string;
  description?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  _count: {
    views: number;
    likes: number;
  };
  tags: string[];
  isPublic: boolean;
  isLiked?: boolean;
}

interface LoaderData {
  user: any;
  doc: Documentation;
  canEdit: boolean;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const { id } = params;

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/docs/${id}`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Response("Documentation not found", { status: 404 });
    }

    const doc = await response.json();
    const canEdit = user.id === doc.author.id;

    return json({ user, doc, canEdit });
  } catch (error) {
    throw new Response("Documentation not found", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const { id } = params;
  
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    if (action === "like") {
      const response = await fetch(`${BACKEND_URL}/api/docs/${id}/like`, {
        method: "POST",
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return { error: "Failed to like documentation" };
      }

      return { success: "Documentation liked" };
    }

    if (action === "delete") {
      const response = await fetch(`${BACKEND_URL}/api/docs/${id}`, {
        method: "DELETE",
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return { error: "Failed to delete documentation" };
      }

      return { success: "Documentation deleted", redirect: "/docs" };
    }

    return { error: "Invalid action" };
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function DocumentationView() {
  const { user, doc, canEdit } = useLoaderData<LoaderData>();
  const actionData = useActionData<typeof action>();

  // Simple markdown-like rendering for demonstration
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-semibold text-gray-900 mt-6 mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-medium text-gray-900 mt-4 mb-2">{line.slice(4)}</h3>;
        }
        
        // Code blocks (simple detection)
        if (line.startsWith('```')) {
          return <div key={index} className="bg-gray-100 rounded-md p-4 my-4 font-mono text-sm overflow-x-auto"><code>{line.slice(3)}</code></div>;
        }
        
        // Inline code
        if (line.includes('`')) {
          const parts = line.split('`');
          return (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {parts.map((part, i) => 
                i % 2 === 1 ? <code key={i} className="bg-gray-100 px-1 rounded text-sm">{part}</code> : part
              )}
            </p>
          );
        }
        
        // Regular paragraphs
        if (line.trim()) {
          return <p key={index} className="mb-4 text-gray-700 leading-relaxed">{line}</p>;
        }
        
        return <br key={index} />;
      });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/docs"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Documentation
          </Link>
          {canEdit && (
            <div className="flex space-x-2">
              <Link
                to={`/docs/${doc.id}/edit`}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </Link>
              <Form method="post" className="inline">
                <input type="hidden" name="_action" value="delete" />
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to delete this documentation?')) {
                      e.preventDefault();
                    }
                  }}
                >
                  Delete
                </button>
              </Form>
            </div>
          )}
        </div>

        {/* Title and Meta */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{doc.title}</h1>
        
        {doc.description && (
          <p className="text-xl text-gray-600 mb-6">{doc.description}</p>
        )}

        {/* Author and Stats */}
        <div className="flex items-center justify-between py-4 border-y border-gray-200">
          <div className="flex items-center">
            <img
              className="h-12 w-12 rounded-full"
              src={doc.author.avatar}
              alt={doc.author.name}
            />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">{doc.author.name}</p>
              <p className="text-sm text-gray-500">@{doc.author.username}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {doc._count.views} views
            </div>
            <div className="flex items-center">
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {doc._count.likes} likes
            </div>
            <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {doc.tags.map((tag) => (
              <Link
                key={tag}
                to={`/explore?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Action Messages */}
      {actionData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{actionData.error}</div>
        </div>
      )}

      {actionData?.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{actionData.success}</div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8">
          <div className="prose prose-lg max-w-none">
            {renderContent(doc.content)}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <Form method="post">
              <input type="hidden" name="_action" value="like" />
              <button
                type="submit"
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  doc.isLiked
                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <svg className="mr-2 h-4 w-4" fill={doc.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {doc.isLiked ? 'Unlike' : 'Like'} ({doc._count.likes})
              </button>
            </Form>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigator.share?.({ 
                  title: doc.title, 
                  url: window.location.href 
                }) || navigator.clipboard?.writeText(window.location.href)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <Link
          to="/docs"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Documentation
        </Link>
        
        <Link
          to="/docs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          Write Documentation
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}