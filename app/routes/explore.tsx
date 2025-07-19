import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Form, useSubmit } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    // Fetch trending content and search results
    const [trendingResponse, searchResponse] = await Promise.all([
      fetch(`${BACKEND_URL}/api/search/trending`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      query ? fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }) : null
    ]);

    const trending = trendingResponse.ok ? await trendingResponse.json() : [];
    const searchResults = searchResponse?.ok ? await searchResponse.json() : null;

    return json({ trending, searchResults, query });
  } catch (error) {
    return json({ trending: [], searchResults: null, query });
  }
}

export default function Explore() {
  const { trending, searchResults, query } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState(query);
  const submit = useSubmit();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      submit({ q: searchQuery }, { method: "get" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore</h1>
        <Form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for snippets, docs, or users..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </Form>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Search Results for "{query}"
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-gray-500">No results found.</p>
          ) : (
            <div className="space-y-4">
              {searchResults.map((item: any) => (
                <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 mt-1">{item.description || item.content?.substring(0, 150)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trending Content */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trending</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trending.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{item.description?.substring(0, 100)}...</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{item.author?.name}</span>
                <span>{item._count?.likes || 0} likes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}