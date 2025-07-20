import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Code, FileText } from "lucide-react";
import { useState } from "react";
import BugStories from "~/components/Bugs/BugStories";
import AppLayout from "~/components/Layout/AppLayout";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const [feedRes, storiesRes, suggestionsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/feed?page=1&limit=10`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/stories/active`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/users/suggestions`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
    ]);

    const feed = feedRes.ok ? await feedRes.json() : { data: [] };
    const stories = storiesRes.ok ? await storiesRes.json() : { data: [] };
    const suggestions = suggestionsRes.ok ? await suggestionsRes.json() : { data: [] };

    return json({ user, feed, stories, suggestions });
  } catch (error) {
    return json({ 
      user, 
      feed: { data: [] }, 
      stories: { data: [] }, 
      suggestions: { data: [] } 
    });
  }
}

export default function Home() {
  const { user, feed, stories, suggestions } = useLoaderData<typeof loader>();

  return (
    <AppLayout user={user}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stories */}
            <BugStories stories={stories.data} currentUser={user} />

            {/* Feed Posts */}
            <div className="space-y-6">
              {feed.data.length === 0 ? (
                <EmptyFeed user={user} />
              ) : (
                feed.data.map((post: any) => (
                  <FeedPost key={post.id} post={post} currentUser={user} />
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* User Profile Card */}
            <UserProfileCard user={user} />
            
            {/* Suggestions */}
            <SuggestionsCard suggestions={suggestions.data} />

            {/* Trending Tags */}
            <TrendingCard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function FeedPost({ post, currentUser }: { post: any; currentUser: any }) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [showComments, setShowComments] = useState(false);

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'snippet': return <Code className="w-4 h-4" />;
      case 'doc': return <FileText className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link to={`/u/${post.author.username}`}>
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full ring-2 ring-gray-100"
            />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Link
                to={`/u/${post.author.username}`}
                className="font-semibold text-gray-900 hover:text-purple-600 text-sm"
              >
                {post.author.username}
              </Link>
              <div className="flex items-center space-x-1 text-purple-600">
                {getPostIcon(post.type)}
                <span className="text-xs font-medium">{post.type}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <Link to={`/${post.type}s/${post.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600">
            {post.title}
          </h3>
          {post.description && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-3">{post.description}</p>
          )}
        </Link>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Code Preview for Snippets */}
      {post.type === 'snippet' && post.content && (
        <div className="mx-4 mb-4 bg-gray-900 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-medium">
            {post.language}
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto max-h-40">
            <code>{post.content.substring(0, 200)}...</code>
          </pre>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.likesCount || 0}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">{post.commentsCount || 0}</span>
            </button>
            
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <Send className="w-6 h-6" />
            </button>
          </div>
          
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`transition-colors ${
              isBookmarked ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Like count */}
        {post.likesCount > 0 && (
          <p className="text-sm font-medium text-gray-900 mt-2">
            {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* View post link */}
        <Link
          to={`/${post.type}s/${post.id}`}
          className="text-sm text-gray-500 hover:text-purple-600 mt-1 block"
        >
          View all {post.commentsCount || 0} comments
        </Link>
      </div>
    </div>
  );
}

function UserProfileCard({ user }: { user: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center space-x-3">
        <Link to={`/u/${user.username}`}>
          <img
            src={user.avatar}
            alt={user.name}
            className="w-14 h-14 rounded-full ring-2 ring-gray-100"
          />
        </Link>
        <div className="flex-1">
          <Link to={`/u/${user.username}`} className="block">
            <p className="font-semibold text-gray-900 hover:text-purple-600">
              {user.name}
            </p>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </Link>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900">{user.snippetsCount || 0}</p>
          <p className="text-xs text-gray-500">Snippets</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{user.followersCount || 0}</p>
          <p className="text-xs text-gray-500">Followers</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{user.followingCount || 0}</p>
          <p className="text-xs text-gray-500">Following</p>
        </div>
      </div>
    </div>
  );
}

function SuggestionsCard({ suggestions }: { suggestions: any[] }) {
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Suggested for you</h3>
        <Link to="/explore?type=users" className="text-sm text-purple-600 hover:text-purple-700">
          See All
        </Link>
      </div>
      
      <div className="space-y-3">
        {suggestions.slice(0, 5).map((suggestion: any) => (
          <div key={suggestion.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to={`/u/${suggestion.username}`}>
                <img
                  src={suggestion.avatar}
                  alt={suggestion.name}
                  className="w-8 h-8 rounded-full"
                />
              </Link>
              <div>
                <Link
                  to={`/u/${suggestion.username}`}
                  className="text-sm font-medium text-gray-900 hover:text-purple-600"
                >
                  {suggestion.username}
                </Link>
                <p className="text-xs text-gray-500">{suggestion.mutualCount} mutual connections</p>
              </div>
            </div>
            <button className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendingCard() {
  const trendingTags = [
    { name: 'react', count: 245 },
    { name: 'javascript', count: 189 },
    { name: 'python', count: 156 },
    { name: 'nextjs', count: 134 },
    { name: 'typescript', count: 98 },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Trending Today</h3>
      
      <div className="space-y-3">
        {trendingTags.map((tag, index) => (
          <Link
            key={tag.name}
            to={`/explore?tag=${tag.name}`}
            className="flex items-center justify-between hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">#{tag.name}</p>
              <p className="text-xs text-gray-500">{tag.count} posts</p>
            </div>
            <span className="text-xs font-medium text-purple-600">#{index + 1}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyFeed({ user }: { user: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Code className="w-10 h-10 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to CodeGram!</h3>
      <p className="text-gray-600 mb-6">
        Start following developers and discover amazing code snippets, documentation, and stories.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/explore"
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
        >
          Explore CodeGram
        </Link>
        <Link
          to="/snippets/new"
          className="px-6 py-3 border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-medium"
        >
          Share Your First Snippet
        </Link>
      </div>
    </div>
  );
}