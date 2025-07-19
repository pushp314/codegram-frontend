import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

interface Snippet {
  id: string;
  title: string;
  description?: string;
  content: string;
  language: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

interface LoaderData {
  user: any;
  snippets: Snippet[];
  trendingTags: string[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    // Fetch recent snippets for the feed
    const snippetsResponse = await fetch(`${BACKEND_URL}/api/snippets?page=1&limit=20`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const snippetsData = snippetsResponse.ok ? await snippetsResponse.json() : { snippets: [] };
    
    // Fetch trending tags (optional)
    const tagsResponse = await fetch(`${BACKEND_URL}/api/tags/trending`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const tagsData = tagsResponse.ok ? await tagsResponse.json() : { tags: [] };

    return json({ 
      user, 
      snippets: snippetsData.snippets || [],
      trendingTags: tagsData.tags || []
    });
  } catch (error) {
    return json({ 
      user, 
      snippets: [],
      trendingTags: []
    });
  }
}

export default function DashboardIndex() {
  const { user, snippets, trendingTags } = useLoaderData<LoaderData>();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
          <p className="text-gray-600 mt-1">Discover the latest code snippets and documentation</p>
        </div>
        <Link
          to="/snippets/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          Create Snippet
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          {snippets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first snippet or following some developers.</p>
              <div className="mt-6">
                <Link
                  to="/snippets/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create your first snippet
                </Link>
              </div>
            </div>
          ) : (
            snippets.map((snippet) => (
              <div key={snippet.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={snippet.author.avatar}
                      alt={snippet.author.name}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{snippet.author.name}</p>
                      <p className="text-sm text-gray-500">@{snippet.author.username}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(snippet.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Link to={`/snippets/${snippet.id}`} className="hover:text-blue-600">
                    {snippet.title}
                  </Link>
                </h3>
                
                {snippet.description && (
                  <p className="text-gray-600 mb-4">{snippet.description}</p>
                )}
                
                <div className="bg-gray-50 rounded-md p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">{snippet.language}</span>
                  </div>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
                    <code>{snippet.content.substring(0, 200)}{snippet.content.length > 200 ? '...' : ''}</code>
                  </pre>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <button className="flex items-center space-x-1 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{snippet._count.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:text-blue-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{snippet._count.comments}</span>
                  </button>
                  <Link 
                    to={`/snippets/${snippet.id}`}
                    className="flex items-center space-x-1 hover:text-blue-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>View</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Tags */}
          {trendingTags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Tags</h3>
              <div className="space-y-2">
                {trendingTags.slice(0, 10).map((tag) => (
                  <Link
                    key={tag}
                    to={`/explore?tag=${encodeURIComponent(tag)}`}
                    className="block text-blue-600 hover:text-blue-800 text-sm"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/snippets/new"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                Create Snippet
              </Link>
              <Link
                to="/docs/new"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                Write Documentation
              </Link>
              <Link
                to="/bugs/new"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                Report Bug
              </Link>
              <Link
                to="/explore"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                Explore Content
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}