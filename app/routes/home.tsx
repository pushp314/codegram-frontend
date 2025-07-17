import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link, Form, Outlet } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  // Fetch recent snippets for feed
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const response = await fetch(`${BACKEND_URL}/api/snippets?page=1&limit=10`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const feedData = response.ok ? await response.json() : { snippets: [] };
    
    return json({ user, feed: feedData });
  } catch (error) {
    return json({ user, feed: { snippets: [] } });
  }
}

export default function Home() {
  const { user, feed } = useLoaderData<typeof loader>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold">CodeGram</h1>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <div className="space-y-1">
            {/* Home */}
            <Link
              to="/home"
              className="flex items-center px-4 py-3 text-blue-400 bg-blue-900/20 border-r-2 border-blue-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!sidebarCollapsed && <span className="ml-3">Home</span>}
            </Link>

            {/* Search */}
            <Link
              to="/search"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {!sidebarCollapsed && <span className="ml-3">Search</span>}
            </Link>

            {/* Explore */}
            <Link
              to="/explore"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {!sidebarCollapsed && <span className="ml-3">Explore</span>}
            </Link>

            {/* Docs */}
            <Link
              to="/docs"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {!sidebarCollapsed && <span className="ml-3">Docs</span>}
            </Link>

            {/* Create */}
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {!sidebarCollapsed && <span className="ml-3">Create</span>}
              </button>
              
              {showCreateMenu && !sidebarCollapsed && (
                <div className="absolute left-full top-0 ml-2 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-700">
                  <Link
                    to="/snippets/new"
                    className="flex items-center px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Code Snippet
                  </Link>
                  <Link
                    to="/docs/new"
                    className="flex items-center px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Documentation
                  </Link>
                </div>
              )}
            </div>

            {/* Profile */}
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white"
            >
              <img
                className="w-5 h-5 rounded-full"
                src={user.avatar}
                alt={user.name}
              />
              {!sidebarCollapsed && <span className="ml-3">Profile</span>}
            </Link>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 p-4">
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-full flex items-center px-0 py-2 text-gray-300 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {!sidebarCollapsed && <span className="ml-3">More</span>}
            </button>
            
            {showMoreMenu && !sidebarCollapsed && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-700">
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
                <Link
                  to="/saved"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Saved
                </Link>
                <Form method="post" action="/logout">
                  <button
                    type="submit"
                    className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </Form>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center px-0 py-2 text-gray-300 hover:text-white mt-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {!sidebarCollapsed && <span className="ml-3">Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Home</h1>
                <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
              </div>
              <Link
                to="/snippets/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Create Snippet
              </Link>
            </div>

            {/* Feed */}
            <div className="space-y-6">
              {feed.snippets.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first snippet or following some developers.</p>
                </div>
              ) : (
                feed.snippets.map((snippet: any) => (
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
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{snippet.title}</h3>
                    {snippet.description && (
                      <p className="text-gray-600 mb-4">{snippet.description}</p>
                    )}
                    
                    <div className="bg-gray-50 rounded-md p-4 mb-4">
                      <pre className="text-sm text-gray-800 overflow-x-auto">
                        <code>{snippet.content.substring(0, 200)}...</code>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}