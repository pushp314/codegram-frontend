import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'snippet' | 'documentation' | 'user';
  content?: string;
  language?: string;
  author?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

interface LoaderData {
  user: any;
  results: SearchResult[];
  query: string;
  trendingTags: string[];
  suggestedUsers: any[];
  totalResults: number;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const type = url.searchParams.get("type") || "";
  const tag = url.searchParams.get("tag") || "";

  try {
    // Build search query
    const searchParams = new URLSearchParams();
    if (query) searchParams.set("q", query);
    if (type) searchParams.set("type", type);
    if (tag) searchParams.set("tag", tag);
    searchParams.set("page", "1");
    searchParams.set("limit", "20");

    // Search API call
    const searchResponse = await fetch(`${BACKEND_URL}/api/search?${searchParams}`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const searchData = searchResponse.ok ? await searchResponse.json() : { results: [], total: 0 };

    // Fetch trending tags
    const tagsResponse = await fetch(`${BACKEND_URL}/api/tags/trending`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const tagsData = tagsResponse.ok ? await tagsResponse.json() : { tags: [] };

    // Fetch suggested users (if no search query)
    let suggestedUsers = [];
    if (!query) {
      const usersResponse = await fetch(`${BACKEND_URL}/api/users/suggested`, {
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });
      
      const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] };
      suggestedUsers = usersData.users || [];
    }

    return json({
      user,
      results: searchData.results || [],
      query,
      trendingTags: tagsData.tags || [],
      suggestedUsers,
      totalResults: searchData.total || 0
    });
  } catch (error) {
    return json({
      user,
      results: [],
      query,
      trendingTags: [],
      suggestedUsers: [],
      totalResults: 0
    });
  }
}

export default function Explore() {
  const { user, results, query, trendingTags, suggestedUsers, totalResults } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("type") || "all");

  const tabs = [
    { id: "all", name: "All", count: totalResults },
    { id: "snippet", name: "Snippets", count: results.filter(r => r.type === 'snippet').length },
    { id: "documentation", name: "Docs", count: results.filter(r => r.type === 'documentation').length },
    { id: "user", name: "Users", count: results.filter(r => r.type === 'user').length },
  ];

  const filteredResults = activeTab === "all" ? results : results.filter(r => r.type === activeTab);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore</h1>
        
        {/* Search Bar */}
        <Form method="get" className="max-w-2xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search snippets, documentation, and users..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <input type="hidden" name="type" value={activeTab !== "all" ? activeTab : ""} />
          </div>
        </Form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          {query && (
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                    {tab.count > 0 && (
                      <span className="ml-2 bg-gray-100 text-gray-900 rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Results */}
          {query ? (
            <div className="space-y-6">
              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try different keywords or explore trending content.</p>
                </div>
              ) : (
                filteredResults.map((result) => (
                  <SearchResultCard key={result.id} result={result} />
                ))
              )}
            </div>
          ) : (
            // Default explore content when no search query
            <div className="space-y-8">
              {/* Suggested Users */}
              {suggestedUsers.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Suggested Users</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedUsers.map((user) => (
                      <SuggestedUserCard key={user.id} user={user} />
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Content */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Content</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-gray-500">Use the search bar to discover snippets, documentation, and users.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Tags */}
          {trendingTags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Tags</h3>
              <div className="space-y-2">
                {trendingTags.slice(0, 15).map((tag) => (
                  <Form key={tag} method="get" className="inline-block mr-2 mb-2">
                    <input type="hidden" name="tag" value={tag} />
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      #{tag}
                    </button>
                  </Form>
                ))}
              </div>
            </div>
          )}

          {/* Search Tips */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Tips</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Use quotes for exact phrases</p>
              <p>• Search by language: <code className="bg-gray-100 px-1 rounded">language:javascript</code></p>
              <p>• Find by author: <code className="bg-gray-100 px-1 rounded">author:username</code></p>
              <p>• Filter by tags: <code className="bg-gray-100 px-1 rounded">tag:react</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            result.type === 'snippet' ? 'bg-blue-100 text-blue-800' :
            result.type === 'documentation' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {result.type}
          </span>
          {result.author && (
            <div className="ml-4 flex items-center">
              <img
                className="h-6 w-6 rounded-full"
                src={result.author.avatar}
                alt={result.author.name}
              />
              <span className="ml-2 text-sm text-gray-500">@{result.author.username}</span>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {new Date(result.createdAt).toLocaleDateString()}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {result.type === 'user' ? (
          <span>@{result.title}</span>
        ) : (
          <span>{result.title}</span>
        )}
      </h3>

      {result.description && (
        <p className="text-gray-600 mb-4">{result.description}</p>
      )}

      {result.content && result.type === 'snippet' && (
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">{result.language}</span>
          </div>
          <pre className="text-sm text-gray-800 overflow-x-auto">
            <code>{result.content.substring(0, 150)}{result.content.length > 150 ? '...' : ''}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function SuggestedUserCard({ user }: { user: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center">
        <img
          className="h-12 w-12 rounded-full"
          src={user.avatar}
          alt={user.name}
        />
        <div className="ml-4 flex-1">
          <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
          <p className="text-sm text-gray-500">@{user.username}</p>
          {user.bio && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>
        <button className="ml-4 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
          Follow
        </button>
      </div>
    </div>
  );
}