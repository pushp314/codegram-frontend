import { useState } from 'react';
import { Link } from '@remix-run/react';
import { TrendingUp, Clock, Star, Eye, Heart, MessageCircle, Code, FileText, User } from 'lucide-react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireAuth } from '~/utils/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  return json({ user });
}

export default function Explore() {
  const { user } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'popular'>('trending');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'snippets' | 'docs' | 'users'>('all');

  // Mock data for demonstration
  const mockContent = {
    trending: [
      {
        type: 'snippet',
        id: '1',
        title: 'Beautiful Login Form',
        description: 'A stunning login form with gradient backgrounds and smooth animations',
        author: { username: 'alexdev', avatar: '/default-avatar.png' },
        language: 'HTML/CSS',
        likes: 245,
        views: 1230,
        tags: ['css', 'animation', 'form']
      },
      {
        type: 'doc',
        id: '2',
        title: 'React Performance Optimization',
        description: 'Complete guide to optimizing React applications for better performance',
        author: { username: 'sarah_ui', avatar: '/default-avatar.png' },
        category: 'React',
        likes: 189,
        views: 2100,
        tags: ['react', 'performance', 'optimization']
      },
      {
        type: 'user',
        id: '3',
        username: 'mike_frontend',
        name: 'Mike Johnson',
        bio: 'Frontend Developer specializing in React and TypeScript',
        avatar: '/default-avatar.png',
        followers: 1234,
        following: 567,
        repositories: 89
      }
    ],
    recent: [
      {
        type: 'snippet',
        id: '4',
        title: 'TypeScript Utility Types',
        description: 'Commonly used TypeScript utility types with examples',
        author: { username: 'typescript_pro', avatar: '/default-avatar.png' },
        language: 'TypeScript',
        likes: 67,
        views: 340,
        tags: ['typescript', 'types', 'utilities']
      }
    ],
    popular: [
      {
        type: 'doc',
        id: '5',
        title: 'Complete CSS Grid Guide',
        description: 'Everything you need to know about CSS Grid Layout',
        author: { username: 'css_master', avatar: '/default-avatar.png' },
        category: 'CSS',
        likes: 892,
        views: 5600,
        tags: ['css', 'grid', 'layout']
      }
    ]
  };

  const filterContentByCategory = (content: any[]) => {
    if (selectedCategory === 'all') return content;
    return content.filter(item => item.type === selectedCategory.slice(0, -1));
  };

  const currentContent = filterContentByCategory(mockContent[activeTab] || []);

  const featuredTags = [
    { name: 'React', count: 1234, color: 'bg-blue-100 text-blue-800' },
    { name: 'TypeScript', count: 892, color: 'bg-purple-100 text-purple-800' },
    { name: 'CSS', count: 756, color: 'bg-pink-100 text-pink-800' },
    { name: 'JavaScript', count: 1567, color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Node.js', count: 445, color: 'bg-green-100 text-green-800' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
          <p className="text-gray-600 mt-1">Discover amazing code, documentation, and developers</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'trending', label: 'Trending', icon: TrendingUp },
            { key: 'recent', label: 'Recent', icon: Clock },
            { key: 'popular', label: 'Popular', icon: Star },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Category Filter */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {['all', 'snippets', 'docs', 'users'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentContent.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                {item.type === 'snippet' ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Code className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-purple-600">Snippet</span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.language}</span>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{item.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{item.views}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <img
                          src={item.author.avatar}
                          alt={item.author.username}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-600">@{item.author.username}</span>
                      </div>
                    </div>
                  </div>
                ) : item.type === 'doc' ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-green-600">Documentation</span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{item.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{item.views}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <img
                          src={item.author.avatar}
                          alt={item.author.username}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-600">@{item.author.username}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-blue-600">Developer</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.avatar}
                        alt={item.username}
                        className="w-16 h-16 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600 text-sm">@{item.username}</p>
                        <p className="text-gray-500 text-xs mt-1">{item.bio}</p>
                      </div>
                    </div>

                    <div className="flex justify-between text-center">
                      <div>
                        <div className="font-semibold text-gray-900">{item.followers}</div>
                        <div className="text-xs text-gray-500">Followers</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.following}</div>
                        <div className="text-xs text-gray-500">Following</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.repositories}</div>
                        <div className="text-xs text-gray-500">Repos</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              Load More Content
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Tags */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Popular Tags</h3>
            <div className="space-y-3">
              {featuredTags.map((tag) => (
                <Link
                  key={tag.name}
                  to={`/explore?tag=${tag.name.toLowerCase()}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}>
                      #{tag.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{tag.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Community Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Snippets</span>
                <span className="font-semibold">12,456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documentation</span>
                <span className="font-semibold">3,789</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Developers</span>
                <span className="font-semibold">8,234</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}