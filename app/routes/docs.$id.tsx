import { LoaderFunctionArgs, ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Link, Form } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag,
  FileText,
  Clock
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from "react-hot-toast";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const { id } = params;
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const [docRes, commentsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/docs/${id}`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/docs/${id}/comments`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
    ]);

    if (!docRes.ok) {
      throw new Response("Documentation not found", { status: 404 });
    }

    const doc = await docRes.json();
    const comments = commentsRes.ok ? await commentsRes.json() : [];

    return json({ doc, comments, currentUser: user });
  } catch (error) {
    throw new Response("Documentation not found", { status: 404 });
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
        await fetch(`${BACKEND_URL}/api/docs/${id}/like`, {
          method: "POST",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        break;
        
      case "bookmark":
        await fetch(`${BACKEND_URL}/api/docs/${id}/bookmark`, {
          method: "POST",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        break;
        
      case "comment":
        const content = formData.get("content");
        await fetch(`${BACKEND_URL}/api/docs/${id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie || "",
          },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
        break;
        
      case "delete":
        await fetch(`${BACKEND_URL}/api/docs/${id}`, {
          method: "DELETE",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        return redirect("/docs");
    }
    
    return json({ success: true });
  } catch (error) {
    return json({ error: "Action failed" }, { status: 400 });
  }
}

export default function DocView() {
  const { doc, comments, currentUser } = useLoaderData<typeof loader>();
  const likeFetcher = useFetcher();
  const bookmarkFetcher = useFetcher();
  const commentFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  
  const [commentText, setCommentText] = useState("");

  const isOwner = currentUser.id === doc.author.id;

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

  const handleBookmark = () => {
    bookmarkFetcher.submit({ intent: 'bookmark' }, { method: 'post' });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentFetcher.submit(
      { intent: 'comment', content: commentText },
      { method: 'post' }
    );
    setCommentText("");
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this documentation? This action cannot be undone.')) {
      deleteFetcher.submit({ intent: 'delete' }, { method: 'post' });
    }
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/docs"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Docs</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/docs/${doc.id}/edit`}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Doc Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                {/* Category Badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <span className="mr-1">{getCategoryIcon(doc.category)}</span>
                    <span>{doc.category}</span>
                  </span>
                </div>

                {/* Author Info */}
                <div className="flex items-center space-x-3 mb-6">
                  <Link to={`/u/${doc.author.username}`}>
                    <img
                      src={doc.author.avatar}
                      alt={doc.author.name}
                      className="w-12 h-12 rounded-full"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/u/${doc.author.username}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {doc.author.name}
                    </Link>
                    <p className="text-sm text-gray-500 flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      @{doc.author.username}
                      <span className="mx-2">•</span>
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(doc.createdAt).toLocaleDateString()}
                      {doc.updatedAt !== doc.createdAt && (
                        <>
                          <span className="mx-2">•</span>
                          <Clock className="w-3 h-3 mr-1" />
                          Updated {new Date(doc.updatedAt).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Title & Description */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{doc.title}</h1>
                {doc.description && (
                  <p className="text-lg text-gray-600 mb-6">{doc.description}</p>
                )}

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {doc.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        to={`/explore?tag=${tag}&type=docs`}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200 transition-colors"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={handleLike}
                      className={`flex items-center space-x-2 transition-colors ${
                        doc.isLiked 
                          ? 'text-red-500' 
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${doc.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{doc.likesCount || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                      className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{comments.length}</span>
                    </button>
                    
                    <button
                      onClick={handleBookmark}
                      className={`transition-colors ${
                        doc.isBookmarked 
                          ? 'text-blue-500' 
                          : 'text-gray-500 hover:text-blue-500'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${doc.isBookmarked ? 'fill-current' : ''}`} />
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

            {/* Documentation Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-8">
                <div className="prose prose-lg prose-blue max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        
                        if (isInline) {
                          return (
                            <code className="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-medium" {...props}>
                              {children}
                            </code>
                          );
                        }
                        
                        return (
                          <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto my-6">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      },
                      table: ({ children }: any) => (
                        <div className="overflow-x-auto my-6">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }: any) => (
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {children}
                        </th>
                      ),
                      td: ({ children }: any) => (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200">
                          {children}
                        </td>
                      ),
                      blockquote: ({ children }: any) => (
                        <blockquote className="border-l-4 border-blue-500 pl-6 my-6 text-gray-700 italic">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }: any) => (
                        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }: any) => (
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }: any) => (
                        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
                          {children}
                        </h3>
                      ),
                    }}
                  >
                    {doc.content}
                  </ReactMarkdown>
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
                        placeholder="Add a comment..."
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
                      <p className="text-gray-500">No comments yet. Be the first to comment!</p>
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
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{comment.content}</ReactMarkdown>
                            </div>
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
            {/* Table of Contents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Table of Contents
                </h3>
                <div className="space-y-2 text-sm">
                  {/* This would be auto-generated from markdown headings */}
                  <a href="#" className="block text-blue-600 hover:text-blue-700">Introduction</a>
                  <a href="#" className="block text-blue-600 hover:text-blue-700 ml-4">Getting Started</a>
                  <a href="#" className="block text-blue-600 hover:text-blue-700">Examples</a>
                  <a href="#" className="block text-blue-600 hover:text-blue-700 ml-4">Basic Usage</a>
                  <a href="#" className="block text-blue-600 hover:text-blue-700 ml-4">Advanced Features</a>
                  <a href="#" className="block text-blue-600 hover:text-blue-700">Conclusion</a>
                </div>
              </div>
            </div>

            {/* Author Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="text-center">
                  <Link to={`/u/${doc.author.username}`}>
                    <img
                      src={doc.author.avatar}
                      alt={doc.author.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4"
                    />
                  </Link>
                  <h3 className="text-lg font-semibold text-gray-900">{doc.author.name}</h3>
                  <p className="text-gray-500 mb-4">@{doc.author.username}</p>
                  {doc.author.bio && (
                    <p className="text-sm text-gray-600 mb-4">{doc.author.bio}</p>
                  )}
                  <Link
                    to={`/u/${doc.author.username}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views</span>
                    <span className="font-medium">{doc.viewsCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Likes</span>
                    <span className="font-medium">{doc.likesCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comments</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bookmarks</span>
                    <span className="font-medium">{doc.bookmarksCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}