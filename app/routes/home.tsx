import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { Plus, Code, FileText, Bug } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const [snippetsRes, bugsRes, trendsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/snippets/feed?page=1&limit=10`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/bugs/feed`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/trending/tags`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
    ]);

    const snippets = snippetsRes.ok ? await snippetsRes.json() : { data: [] };
    const bugs = bugsRes.ok ? await bugsRes.json() : { data: [] };
    const trends = trendsRes.ok ? await trendsRes.json() : { tags: [] };

    return json({ user, snippets, bugs, trends });
  } catch (error) {
    return json({ user, snippets: { data: [] }, bugs: { data: [] }, trends: { tags: [] } });
  }
}

export default function Home() {
  const { user, snippets, bugs, trends } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/home" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">CodeGram</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/snippets/new"
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Snippet</span>
              </Link>
              
              <Link to={`/u/${user.username}`}>
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.avatar}
                  alt={user.name}
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stories/Bugs Section */}
            {bugs.data.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Bug className="w-5 h-5 mr-2 text-red-500" />
                  Developer Stories
                </h2>
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {bugs.data.map((bug: any) => (
                    <Link
                      key={bug.id}
                      to={`/bugs/${bug.id}`}
                      className="flex-shrink-0 cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-full ring-2 ring-orange-400 p-0.5 group-hover:ring-orange-500">
                        <img
                          src={bug.author.avatar}
                          alt={bug.author.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center mt-2 text-gray-600 truncate w-16">
                        {bug.author.username}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Content */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  className="h-10 w-10 rounded-full"
                  src={user.avatar}
                  alt={user.name}
                />
                <div className="flex-1">
                  <p className="text-gray-700">What are you working on, {user.name}?</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/snippets/new"
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <Code className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                  <span className="text-gray-600 group-hover:text-blue-600">Share Code</span>
                </Link>
                
                <Link
                  to="/docs/new"
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group"
                >
                  <FileText className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                  <span className="text-gray-600 group-hover:text-green-600">Write Docs</span>
                </Link>
                
                <Link
                  to="/bugs/new"
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all group"
                >
                  <Bug className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                  <span className="text-gray-600 group-hover:text-orange-600">Share Update</span>
                </Link>
              </div>
            </div>

            {/* Snippets Feed */}
            <div className="space-y-6">
              {snippets.data.length === 0 ? (
                <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No snippets yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start following other developers or create your first snippet to see content here.
                  </p>
                  <div className="space-x-4">
                    <Link
                      to="/snippets/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Snippet
                    </Link>
                    <Link
                      to="/explore"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              ) : (
                snippets.data.map((snippet: any) => (
                  <div key={snippet.id} className="bg-white rounded-xl border shadow-sm">
                    {/* Snippet content will be rendered by SnippetCard component */}
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Link to={`/u/${snippet.author.username}`}>
                          <img
                            src={snippet.author.avatar}
                            alt={snippet.author.name}
                            className="w-10 h-10 rounded-full"
                          />
                        </Link>
                        <div>
                          <Link
                            to={`/u/${snippet.author.username}`}
                            className="font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {snippet.author.name}
                          </Link>
                          <p className="text-sm text-gray-500">@{snippet.author.username}</p>
                        </div>
                        <span className="text-sm text-gray-500 ml-auto">
                          {new Date(snippet.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <Link to={`/snippets/${snippet.id}`}>
                        <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
                          {snippet.title}
                        </h2>
                      </Link>
                      
                      <p className="text-gray-600 mb-4">{snippet.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {snippet.tags?.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-gray-500">
                        <span className="flex items-center space-x-1">
                          <span>❤️</span>
                          <span>{snippet.likes || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>💬</span>
                          <span>{snippet.comments || 0}</span>
                        </span>
                        <Link
                          to={`/snippets/${snippet.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View Code
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Tags */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Tags</h3>
              <div className="space-y-2">
                {trends.tags.slice(0, 10).map((tag: any, index: number) => (
                  <Link
                    key={tag.name}
                    to={`/explore?tag=${tag.name}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-gray-700">#{tag.name}</span>
                    <span className="text-sm text-gray-500">{tag.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/snippets/new"
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                >
                  Create Snippet
                </Link>
                <Link
                  to="/docs/new"
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                >
                  Write Documentation
                </Link>
                <Link
                  to="/explore"
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                >
                  Explore Content
                </Link>
                <Link
                  to="/settings"
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}