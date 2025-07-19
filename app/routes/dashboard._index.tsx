import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    // Fetch recent snippets for dashboard feed
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

export default function DashboardIndex() {
  const { user, feed } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
        </div>
        <Link
          to="/snippets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          Create Snippet
        </Link>
      </div>

      {/* Recent Activity Feed */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        
        {feed.snippets.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
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
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">{snippet.language}</span>
                <span>{snippet._count?.likes || 0} likes</span>
                <span>{snippet._count?.comments || 0} comments</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}