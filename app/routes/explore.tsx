import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link, Form } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState, useEffect } from "react";
import { Search, Filter, TrendingUp, Code, Users, Hash, Calendar, Heart, Eye } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const type = url.searchParams.get("type") || "all";
  const language = url.searchParams.get("language") || "";
  const tag = url.searchParams.get("tag") || "";
  const sortBy = url.searchParams.get("sort") || "recent";
  const page = url.searchParams.get("page") || "1";
  
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const searchParams = new URLSearchParams({
      q: query,
      type,
      language,
      tag,
      sort: sortBy,
      page,
      limit: "20"
    });

    const [searchRes, trendsRes, languagesRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/search?${searchParams}`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/trending?type=tags&limit=20`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/trending?type=languages&limit=15`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
    ]);

    const searchResults = searchRes.ok ? await searchRes.json() : { data: [], total: 0 };
    const trendingTags = trendsRes.ok ? await trendsRes.json() : { data: [] };
    const trendingLanguages = languagesRes.ok ? await languagesRes.json() : { data: [] };

    return json({
      searchResults,
      trendingTags,
      trendingLanguages,
      filters: { query, type, language, tag, sortBy, page }
    });
  } catch (error) {
    return json({
      searchResults: { data: [], total: 0 },
      trendingTags: { data: [] },
      trendingLanguages: { data: [] },
      filters: { query, type, language, tag, sortBy, page }
    });
  }
}

export default function Explore() {
  const { searchResults, trendingTags, trendingLanguages, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.query);

  const contentTypes = [
    { value: "all", label: "All Content", icon: "🌐" },
    { value: "snippets", label: "Code Snippets", icon: "📝" },
    { value: "docs", label: "Documentation", icon: "📚" },
    { value: "users", label: "Users", icon: "👥" },
  ];

  const sortOptions = [
    { value: "recent", label: "Most Recent", icon: "🕒" },
    { value: "popular", label: "Most Popular", icon: "🔥" },
    { value: "liked", label: "Most Liked", icon: "❤️" },
    { value: "viewed", label: "Most Viewed", icon: "👁️" },
    { value: "commented", label: "Most Discussed", icon: "💬" },
  ];

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete("page"); // Reset to first page when filtering
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("q", searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explore CodeGram</h1>
              <p className="mt-1 text-lg text-gray-600">
                Discover amazing code snippets, documentation, and developers
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <Form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search snippets, docs, users..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </Form>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {contentTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => updateFilter("type", type.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filters.type === type.value
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={filters.language}
                  onChange={(e) => updateFilter("language", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Languages</option>
                  {trendingLanguages.data.map((lang: any) => (
                    <option key={lang.name} value={lang.name}>
                      {lang.name} ({lang.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
                <select
                  value={filters.tag}
                  onChange={(e) => updateFilter("tag", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Tags</option>
                  {trendingTags.data.map((tag: any) => (
                    <option key={tag.name} value={tag.name}>
                      #{tag.name} ({tag.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setSearchParams({})}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {searchResults.total > 0 ? (
                    <>Found {searchResults.total} results</>
                  ) : (
                    <>No results found</>
                  )}
                </h2>
                {filters.query && (
                  <p className="text-gray-600">for "{filters.query}"</p>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {searchResults.data.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  <button
                    onClick={() => setSearchParams({})}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                searchResults.data.map((item: any) => (
                  <SearchResultCard key={item.id} item={item} type={item.type || filters.type} />
                ))
              )}
            </div>

            {/* Pagination */}
            {searchResults.total > 20 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  {parseInt(filters.page) > 1 && (
                    <button
                      onClick={() => updateFilter("page", (parseInt(filters.page) - 1).toString())}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                  
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {filters.page} of {Math.ceil(searchResults.total / 20)}
                  </span>
                  
                  {parseInt(filters.page) < Math.ceil(searchResults.total / 20) && (
                    <button
                      onClick={() => updateFilter("page", (parseInt(filters.page) + 1).toString())}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Next
                    </button>
                  )}
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Trending Tags
                </h3>
                <div className="space-y-2">
                  {trendingTags.data.slice(0, 10).map((tag: any, index: number) => (
                    <button
                      key={tag.name}
                      onClick={() => updateFilter("tag", tag.name)}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-blue-600 font-medium">#{tag.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{tag.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Popular Languages */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-blue-500" />
                  Popular Languages
                </h3>
                <div className="space-y-2">
                  {trendingLanguages.data.slice(0, 8).map((lang: any) => (
                    <button
                      key={lang.name}
                      onClick={() => updateFilter("language", lang.name)}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-gray-700">{lang.name}</span>
                      <span className="text-sm text-gray-500">{lang.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
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
                    to="/users"
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                  >
                    Find Developers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchResultCard({ item, type }: { item: any; type: string }) {
  switch (type) {
    case 'snippets':
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Link to={`/u/${item.author.username}`}>
                <img
                  src={item.author.avatar}
                  alt={item.author.name}
                  className="w-8 h-8 rounded-full"
                />
              </Link>
              <div>
                <Link
                  to={`/u/${item.author.username}`}
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {item.author.name}
                </Link>
                <p className="text-sm text-gray-500">@{item.author.username}</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>

          <Link to={`/snippets/${item.id}`} className="block">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-gray-600 mb-3">{item.description}</p>
            )}
          </Link>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              {item.language}
            </span>
            {item.tags?.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{item.likesCount || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{item.viewsCount || 0}</span>
            </span>
          </div>
        </div>
      );

    case 'users':
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <Link to={`/u/${item.username}`}>
              <img
                src={item.avatar}
                alt={item.name}
                className="w-16 h-16 rounded-full"
              />
            </Link>
            <div className="flex-1">
              <Link
                to={`/u/${item.username}`}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600"
              >
                {item.name}
              </Link>
              <p className="text-gray-500">@{item.username}</p>
              {item.bio && (
                <p className="text-gray-600 mt-1">{item.bio}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{item.snippetsCount || 0} snippets</span>
                <span>{item.followersCount || 0} followers</span>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-500">Unknown content type: {type}</p>
        </div>
      );
  }
}