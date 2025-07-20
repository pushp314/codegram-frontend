import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";
import { Search, Filter, FileText, Plus, Heart, Eye, Calendar, User } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || "";
  const search = url.searchParams.get("search") || "";
  const sort = url.searchParams.get("sort") || "recent";
  const page = url.searchParams.get("page") || "1";
  
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const searchParams = new URLSearchParams({
      category,
      search,
      sort,
      page,
      limit: "12"
    });

    const [docsRes, categoriesRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/docs?${searchParams}`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/docs/categories`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
    ]);

    const docs = docsRes.ok ? await docsRes.json() : { data: [], total: 0 };
    const categories = categoriesRes.ok ? await categoriesRes.json() : { data: [] };

    return json({ docs, categories, filters: { category, search, sort, page } });
  } catch (error) {
    return json({ 
      docs: { data: [], total: 0 }, 
      categories: { data: [] }, 
      filters: { category, search, sort, page } 
    });
  }
}

export default function DocsIndex() {
  const { docs, categories, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(filters.search);

  const categoryOptions = [
    { value: "", label: "All Categories", icon: "📚", count: null },
    { value: "tutorial", label: "Tutorials", icon: "📖", count: categories.tutorial || 0 },
    { value: "reference", label: "Reference", icon: "📋", count: categories.reference || 0 },
    { value: "guide", label: "Guides", icon: "🗺️", count: categories.guide || 0 },
    { value: "explanation", label: "Explanations", icon: "💡", count: categories.explanation || 0 },
    { value: "changelog", label: "Changelogs", icon: "📝", count: categories.changelog || 0 },
    { value: "faq", label: "FAQ", icon: "❓", count: categories.faq || 0 },
  ];

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "popular", label: "Most Popular" },
    { value: "liked", label: "Most Liked" },
    { value: "viewed", label: "Most Viewed" },
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
    updateFilter("search", searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
              <p className="mt-1 text-lg text-gray-600">
                Discover and share knowledge with the developer community
              </p>
            </div>
            <Link
              to="/docs/new"
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Write Docs</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Search documentation..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => updateFilter("category", category.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        filters.category === category.value
                          ? 'bg-green-100 text-green-800'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span>{category.icon}</span>
                        <span className="font-medium">{category.label}</span>
                      </div>
                      {category.count !== null && (
                        <span className="text-sm text-gray-500">{category.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sort By</h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFilter("sort", option.value)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        filters.sort === option.value
                          ? 'bg-green-100 text-green-800'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {docs.total > 0 ? `${docs.total} documentation${docs.total !== 1 ? 's' : ''}` : 'No documentation found'}
                </h2>
                {filters.search && (
                  <p className="text-gray-600">for "{filters.search}"</p>
                )}
              </div>
            </div>

            {/* Documentation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docs.data.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documentation found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search terms or browse different categories.
                  </p>
                  <Link
                    to="/docs/new"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Write Documentation
                  </Link>
                </div>
              ) : (
                docs.data.map((doc: any) => (
                  <DocCard key={doc.id} doc={doc} />
                ))
              )}
            </div>

            {/* Pagination */}
            {docs.total > 12 && (
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
                    Page {filters.page} of {Math.ceil(docs.total / 12)}
                  </span>
                  
                  {parseInt(filters.page) < Math.ceil(docs.total / 12) && (
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
        </div>
      </div>
    </div>
  );
}

function DocCard({ doc }: { doc: any }) {
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      tutorial: "📖",
      reference: "📋",
      guide: "🗺️",
      explanation: "💡",
      changelog: "📝",
      faq: "❓"
    };
    return icons[category] || "📄";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Category Badge */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {getCategoryIcon(doc.category)} {doc.category}
          </span>
        </div>

        {/* Title & Description */}
        <Link to={`/docs/${doc.id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-green-600 line-clamp-2">
            {doc.title}
          </h3>
          {doc.description && (
            <p className="text-gray-600 mb-4 line-clamp-3">{doc.description}</p>
          )}
        </Link>

        {/* Author */}
        <div className="flex items-center space-x-2 mb-4">
          <Link to={`/u/${doc.author.username}`}>
            <img
              src={doc.author.avatar}
              alt={doc.author.name}
              className="w-6 h-6 rounded-full"
            />
          </Link>
          <Link
            to={`/u/${doc.author.username}`}
            className="text-sm font-medium text-gray-900 hover:text-green-600"
          >
            {doc.author.name}
          </Link>
        </div>

        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {doc.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {doc.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{doc.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{doc.likesCount || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{doc.viewsCount || 0}</span>
            </span>
          </div>
          <span className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
}