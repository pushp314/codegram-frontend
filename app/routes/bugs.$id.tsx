import { LoaderFunctionArgs, ActionFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState, useEffect } from "react";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import toast from "react-hot-toast";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const { id } = params;
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const [bugRes, commentsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/bugs/${id}`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/bugs/${id}/comments`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
    ]);

    if (!bugRes.ok) {
      throw new Response("Story not found", { status: 404 });
    }

    const bug = await bugRes.json();
    const comments = commentsRes.ok ? await commentsRes.json() : [];

    return json({ bug, comments, currentUser: user });
  } catch (error) {
    throw new Response("Story not found", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    switch (intent) {
      case "like":
        await fetch(`${BACKEND_URL}/api/bugs/${id}/like`, {
          method: "POST",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        break;
        
      case "comment":
        const content = formData.get("content");
        await fetch(`${BACKEND_URL}/api/bugs/${id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie || "",
          },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
        break;
        
      case "react":
        const reaction = formData.get("reaction");
        await fetch(`${BACKEND_URL}/api/bugs/${id}/react`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie || "",
          },
          credentials: "include",
          body: JSON.stringify({ reaction }),
        });
        break;
    }
    
    return json({ success: true });
  } catch (error) {
    return json({ error: "Action failed" }, { status: 400 });
  }
}

export default function BugView() {
  const { bug, comments, currentUser } = useLoaderData<typeof loader>();
  const likeFetcher = useFetcher();
  const commentFetcher = useFetcher();
  const reactionFetcher = useFetcher();
  
  const [commentText, setCommentText] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  const isOwner = currentUser.id === bug.author.id;

  // Calculate time remaining
  useEffect(() => {
    const updateTimeLeft = () => {
      const createdAt = new Date(bug.createdAt);
      const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [bug.createdAt]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleLike = () => {
    likeFetcher.submit({ intent: 'like' }, { method: 'post' });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentFetcher.submit(
      { intent: 'comment', content: commentText },
      { method: 'post' }
    );
    setCommentText("");
  };

  const handleReaction = (reaction: string) => {
    reactionFetcher.submit(
      { intent: 'react', reaction },
      { method: 'post' }
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-100';
      case 'high': return 'text-orange-500 bg-orange-100';
      case 'medium': return 'text-yellow-500 bg-yellow-100';
      case 'low': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      update: "📢",
      bug: "🐛",
      feature: "✨",
      tip: "💡",
      question: "❓",
      achievement: "🏆"
    };
    return icons[type] || "📝";
  };

  const reactions = ['👍', '❤️', '😄', '😮', '😢', '😡', '🎉', '🤔'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/home"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Feed</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Story Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                {/* Priority and Type Badges */}
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(bug.priority)}`}>
                    {getPriorityIcon(bug.priority)} {bug.priority} priority
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {getTypeIcon(bug.type)} {bug.type}
                  </span>
                  {timeLeft && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      {timeLeft}
                    </span>
                  )}
                </div>

                {/* Author Info */}
                <div className="flex items-center space-x-3 mb-6">
                  <Link to={`/u/${bug.author.username}`}>
                    <img
                      src={bug.author.avatar}
                      alt={bug.author.name}
                      className="w-12 h-12 rounded-full"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/u/${bug.author.username}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {bug.author.name}
                    </Link>
                    <p className="text-sm text-gray-500 flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      @{bug.author.username}
                      <span className="mx-2">•</span>
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(bug.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Title & Content */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{bug.title}</h1>
                <div className="prose prose-gray max-w-none mb-6">
                  <p className="whitespace-pre-wrap text-gray-700">{bug.content}</p>
                </div>

                {/* Image if present */}
                {bug.imageUrl && (
                  <div className="mb-6">
                    <img
                      src={bug.imageUrl}
                      alt="Story image"
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Tags */}
                {bug.tags && bug.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {bug.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        to={`/explore?tag=${tag}&type=bugs`}
                        className="flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full hover:bg-orange-200 transition-colors"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {reactions.map((reaction) => (
                      <button
                        key={reaction}
                        onClick={() => handleReaction(reaction)}
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <span className="text-lg">{reaction}</span>
                        <span className="text-sm text-gray-600">
                          {bug.reactions?.[reaction] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={handleLike}
                      className={`flex items-center space-x-2 transition-colors ${
                        bug.isLiked 
                          ? 'text-red-500' 
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${bug.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{bug.likesCount || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                      className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{comments.length}</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div id="comments" className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Comments ({comments.length})
                </h2>

                {/* Add Comment */}
                <div className="mb-8">
                  <div className="flex space-x-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a helpful comment..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={handleComment}
                          disabled={!commentText.trim() || commentFetcher.state === "submitting"}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {commentFetcher.state === "submitting" ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No comments yet. Be the first to help!</p>
                    </div>
                  ) : (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Link to={`/u/${comment.author.username}`}>
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.name}
                            className="w-8 h-8 rounded-full"
                          />
                        </Link>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Link
                                to={`/u/${comment.author.username}`}
                                className="font-medium text-gray-900 hover:text-blue-600"
                              >
                                {comment.author.name}
                              </Link>
                              <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Story Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views</span>
                    <span className="font-medium">{bug.viewsCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Likes</span>
                    <span className="font-medium">{bug.likesCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comments</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reactions</span>
                    <span className="font-medium">
                      {bug.reactions ? Object.values(bug.reactions).reduce((a: any, b: any) => a + b, 0) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Author Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="text-center">
                  <Link to={`/u/${bug.author.username}`}>
                    <img
                      src={bug.author.avatar}
                      alt={bug.author.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4"
                    />
                  </Link>
                  <h3 className="text-lg font-semibold text-gray-900">{bug.author.name}</h3>
                  <p className="text-gray-500 mb-4">@{bug.author.username}</p>
                  {bug.author.bio && (
                    <p className="text-sm text-gray-600 mb-4">{bug.author.bio}</p>
                  )}
                  <Link
                    to={`/u/${bug.author.username}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Similar Stories */}
            {bug.relatedBugs && bug.relatedBugs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Stories</h3>
                  <div className="space-y-3">
                    {bug.relatedBugs.slice(0, 3).map((related: any) => (
                      <Link
                        key={related.id}
                        to={`/bugs/${related.id}`}
                        className="block p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span>{getTypeIcon(related.type)}</span>
                          <h4 className="font-medium text-gray-900 truncate">{related.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">by @{related.author.username}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}