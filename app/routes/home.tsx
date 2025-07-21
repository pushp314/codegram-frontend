import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Code, FileText, Bug } from "lucide-react";
import { useState } from "react";
import BugStories from "~/components/Bugs/BugStories";
// Remove this import since sidebar is now global:
// import AppLayout from "~/components/Layout/AppLayout";

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
      fetch(`${BACKEND_URL}/api/bugs?page=1&limit=5`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/follow/suggestions?limit=5`, {
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
    // Remove AppLayout wrapper - it's now handled globally
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stories */}
          <BugStories stories={stories.data || stories.bugs || []} currentUser={user} />

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
          <SuggestionsCard suggestions={suggestions.data || suggestions.users || []} />

          {/* Trending Tags */}
          <TrendingCard />
        </div>
      </div>
    </div>
  );
}

function FeedPost({ post, currentUser }: { post: any; currentUser: any }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const fetcher = useFetcher();

  const handleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev: number) => newLikedState ? prev + 1 : prev - 1);

    const formData = new FormData();
    formData.append('action', 'toggle-like');
    formData.append('contentType', post.type);
    formData.append('contentId', post.id);
    
    fetcher.submit(formData, { method: 'POST', action: '/api/interactions' });
  };

  const handleBookmark = async () => {
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);

    const formData = new FormData();
    formData.append('action', 'toggle-bookmark');
    formData.append('contentType', post.type);
    formData.append('contentId', post.id);
    
    fetcher.submit(formData, { method: 'POST', action: '/api/interactions' });
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'snippet': return <Code className="w-4 h-4" />;
      case 'doc': return <FileText className="w-4 h-4" />;
      case 'bug': return <Bug className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const getContentPreview = () => {
    if (post.type === 'snippet' && post.content) {
      return (
        <div className="mx-4 mb-4 bg-gray-900 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-medium">
            {post.language}
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto max-h-40">
            <code>{post.content.substring(0, 200)}...</code>
          </pre>
        </div>
      );
    } else if (post.type === 'doc' && post.content) {
      return (
        <div className="mx-4 mb-4 prose prose-sm max-w-none">
          <div className="text-gray-700 line-clamp-4">
            {post.content.substring(0, 300)}...
          </div>
        </div>
      );
    } else if (post.type === 'bug' && post.description) {
      return (
        <div className="mx-4 mb-4">
          <p className="text-gray-700 line-clamp-3">{post.description}</p>
          {post.severity && (
            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
              post.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
              post.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {post.severity}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link to={`/u/${post.author.username}`}>
            <img
              src={post.author.avatar || '/default-avatar.png'}
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

      {/* Content Preview */}
      {getContentPreview()}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likesCount}</span>
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
            onClick={handleBookmark}
            className={`transition-colors ${
              isBookmarked ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Like count */}
        {likesCount > 0 && (
          <p className="text-sm font-medium text-gray-900 mt-2">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
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
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={user.avatar || '/default-avatar.png'}
          alt={user.name}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h3 className="font-semibold text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">@{user.username}</p>
        </div>
      </div>
      
      {user.bio && (
        <p className="text-sm text-gray-700 mb-4">{user.bio}</p>
      )}
      
      <div className="flex justify-between text-center">
        <div>
          <p className="font-semibold text-gray-900">{user._count?.snippets || 0}</p>
          <p className="text-xs text-gray-500">Snippets</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user._count?.followers || 0}</p>
          <p className="text-xs text-gray-500">Followers</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user._count?.following || 0}</p>
          <p className="text-xs text-gray-500">Following</p>
        </div>
      </div>
    </div>
  );
}

function SuggestionsCard({ suggestions }: { suggestions: any[] }) {
  if (!suggestions.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Suggested for you</h3>
      <div className="space-y-4">
        {suggestions.slice(0, 3).map((user: any) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar || '/default-avatar.png'}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900 text-sm">{user.username}</p>
                <p className="text-xs text-gray-500">{user._count?.followers || 0} followers</p>
              </div>
            </div>
            <Link
              to={`/u/${user.username}`}
              className="text-xs font-medium text-purple-600 hover:text-purple-700"
            >
              Follow
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendingCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Trending Tags</h3>
      <div className="space-y-3">
        {['javascript', 'react', 'typescript', 'python', 'nextjs'].map((tag, index) => (
          <Link
            key={tag}
            to={`/explore?tag=${tag}`}
            className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg -m-2"
          >
            <div>
              <p className="font-medium text-gray-900 text-sm">#{tag}</p>
              <p className="text-xs text-gray-500">{Math.floor(Math.random() * 100) + 10} posts</p>
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