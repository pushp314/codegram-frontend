import { useState, useEffect } from 'react';
import { useSearchParams, Link } from '@remix-run/react';
import { Search as SearchIcon, User, X, Clock, TrendingUp } from 'lucide-react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireAuth } from '~/utils/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  return json({ user });
}

export default function Search() {
  const { user } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState<'all' | 'users' | 'snippets' | 'docs'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'react hooks',
    'tailwind css',
    'javascript array methods'
  ]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      setQuery(searchQuery);
      setSearchParams({ q: searchQuery, filter });
      
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 10);
        return updated;
      });
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
  };

  const removeRecentSearch = (searchToRemove: string) => {
    setRecentSearches(prev => prev.filter(s => s !== searchToRemove));
  };

  // Mock search results based on filter
  const getSearchResults = () => {
    if (!query) return [];

    const mockResults = {
      users: [
        { id: '1', username: 'alexdev', name: 'Alex Developer', avatar: '/default-avatar.png', followers: 1234 },
        { id: '2', username: 'sarah_ui', name: 'Sarah UI Designer', avatar: '/default-avatar.png', followers: 892 },
      ],
      snippets: [
        { id: '1', title: 'React Custom Hook', description: 'Useful custom hook for API calls', language: 'TypeScript', likes: 45 },
        { id: '2', title: 'CSS Grid Layout', description: 'Responsive grid layout with CSS Grid', language: 'CSS', likes: 23 },
      ],
      docs: [
        { id: '1', title: 'Getting Started with React', description: 'Complete guide to React fundamentals', category: 'React', views: 1230 },
        { id: '2', title: 'Tailwind CSS Best Practices', description: 'How to structure your Tailwind CSS project', category: 'CSS', views: 890 },
      ]
    };

    if (filter === 'all') {
      return [
        ...mockResults.users.map(item => ({ ...item, type: 'user' })),
        ...mockResults.snippets.map(item => ({ ...item, type: 'snippet' })),
        ...mockResults.docs.map(item => ({ ...item, type: 'doc' })),
      ];
    }

    return mockResults[filter].map(item => ({ ...item, type: filter.slice(0, -1) }));
  };

  const searchResults = getSearchResults();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Search</h1>
          
          {/* Search Input */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, snippets, docs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
              className="w-full pl-10 pr-10 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {['all', 'users', 'snippets', 'docs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  filter === tab
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Search Results */}
          {query ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Results for "{query}"
              </h2>
              
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((result: any) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100"
                    >
                      {result.type === 'user' ? (
                        <>
                          <img
                            src={result.avatar}
                            alt={result.username}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{result.name}</h3>
                            <p className="text-sm text-gray-500">@{result.username}</p>
                            <p className="text-xs text-gray-400">{result.followers} followers</p>
                          </div>
                          <User className="w-5 h-5 text-gray-400" />
                        </>
                      ) : result.type === 'snippet' ? (
                        <>
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <SearchIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{result.title}</h3>
                            <p className="text-sm text-gray-500">{result.description}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">{result.language}</span>
                              <span className="text-xs text-gray-400">{result.likes} likes</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <SearchIcon className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{result.title}</h3>
                            <p className="text-sm text-gray-500">{result.description}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">{result.category}</span>
                              <span className="text-xs text-gray-400">{result.views} views</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </div>
          ) : (
            /* Recent Searches & Trending */
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Searches
                  </h3>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-lg"
                      >
                        <button
                          onClick={() => handleSearch(search)}
                          className="flex items-center space-x-3 flex-1 text-left"
                        >
                          <SearchIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{search}</span>
                        </button>
                        <button
                          onClick={() => removeRecentSearch(search)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </h3>
                <div className="space-y-2">
                  {['React 18 features', 'CSS Grid vs Flexbox', 'TypeScript best practices'].map((trend, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(trend)}
                      className="flex items-center space-x-3 w-full p-2 text-left hover:bg-gray-50 rounded-lg"
                    >
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-700">{trend}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}