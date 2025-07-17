import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const response = await fetch(`${BACKEND_URL}/api/snippets?page=${page}&limit=10`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch snippets");
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    return json({ snippets: [], total: 0, pages: 0, currentPage: 1 });
  }
}

export default function SnippetsFeed() {
  const { snippets, total, pages, currentPage } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Code Snippets</h1>
          <Link
            to="/snippets/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            Create Snippet
          </Link>
        </div>

        {/* Snippets List */}
        <div className="space-y-6">
          {snippets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No snippets yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first snippet.</p>
              <div className="mt-6">
                <Link
                  to="/snippets/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Snippet
                </Link>
              </div>
            </div>
          ) : (
            snippets.map((snippet: any) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2">
              {currentPage > 1 && (
                <Link
                  to={`?page=${currentPage - 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              
              {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  to={`?page=${page}`}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </Link>
              ))}
              
              {currentPage < pages && (
                <Link
                  to={`?page=${currentPage + 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

function SnippetCard({ snippet }: { snippet: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <img
              className="h-8 w-8 rounded-full"
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

        {/* Content */}
        <Link to={`/snippets/${snippet.id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
            {snippet.title}
          </h3>
          {snippet.description && (
            <p className="text-gray-600 mb-3">{snippet.description}</p>
          )}
        </Link>

        {/* Code Preview */}
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {snippet.language}
            </span>
          </div>
          <pre className="text-sm text-gray-800 overflow-x-auto">
            <code>{snippet.content.substring(0, 200)}...</code>
          </pre>
        </div>

        {/* Tags */}
        {snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {snippet.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-6 text-sm text-gray-500">
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
          
          <button className="flex items-center space-x-1 hover:text-yellow-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>{snippet._count.bookmarks}</span>
          </button>
        </div>
      </div>
    </div>
  );
}