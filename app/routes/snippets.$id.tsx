import { LoaderFunctionArgs, ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Link, Form } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Eye, Edit3, Trash2, ArrowLeft, Calendar, User, Tag } from "lucide-react";
import CodeEditor from "~/components/Editor/CodeEditor";
import toast from "react-hot-toast";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const { id } = params;
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const [snippetRes, commentsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/snippets/${id}`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/snippets/${id}/comments`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
    ]);

    if (!snippetRes.ok) {
      throw new Response("Snippet not found", { status: 404 });
    }

    const snippet = await snippetRes.json();
    const comments = commentsRes.ok ? await commentsRes.json() : [];

    return json({ snippet, comments, currentUser: user });
  } catch (error) {
    throw new Response("Snippet not found", { status: 404 });
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
        await fetch(`${BACKEND_URL}/api/snippets/${id}/like`, {
          method: "POST",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        break;
        
      case "bookmark":
        await fetch(`${BACKEND_URL}/api/snippets/${id}/bookmark`, {
          method: "POST",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        break;
        
      case "comment":
        const content = formData.get("content");
        await fetch(`${BACKEND_URL}/api/snippets/${id}/comments`, {
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
        await fetch(`${BACKEND_URL}/api/snippets/${id}`, {
          method: "DELETE",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        return redirect("/home");
    }
    
    return json({ success: true });
  } catch (error) {
    return json({ error: "Action failed" }, { status: 400 });
  }
}

export default function SnippetView() {
  const { snippet, comments, currentUser } = useLoaderData<typeof loader>();
  const likeFetcher = useFetcher();
  const bookmarkFetcher = useFetcher();
  const commentFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  
  const [showPreview, setShowPreview] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isOwner = currentUser.id === snippet.author.id;
  const canPreview = ['html', 'css', 'javascript'].includes(snippet.language.toLowerCase());

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleLike = () => {
    likeFetcher.submit(
      { intent: 'like' },
      { method: 'post' }
    );
  };

  const handleBookmark = () => {
    bookmarkFetcher.submit(
      { intent: 'bookmark' },
      { method: 'post' }
    );
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
    if (confirm('Are you sure you want to delete this snippet? This action cannot be undone.')) {
      deleteFetcher.submit(
        { intent: 'delete' },
        { method: 'post' }
      );
    }
  };

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
            
            <div className="flex items-center space-x-3">
              {canPreview && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </button>
              )}
              
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/snippets/${snippet.id}/edit`}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Snippet Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                {/* Author Info */}
                <div className="flex items-center space-x-3 mb-6">
                  <Link to={`/u/${snippet.author.username}`}>
                    <img
                      src={snippet.author.avatar}
                      alt={snippet.author.name}
                      className="w-12 h-12 rounded-full"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/u/${snippet.author.username}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {snippet.author.name}
                    </Link>
                    <p className="text-sm text-gray-500 flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      @{snippet.author.username}
                      <span className="mx-2">•</span>
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(snippet.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Title & Description */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{snippet.title}</h1>
                {snippet.description && (
                  <p className="text-lg text-gray-600 mb-6">{snippet.description}</p>
                )}

                {/* Tags */}
                {snippet.tags && snippet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {snippet.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        to={`/explore?tag=${tag}`}
                        className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
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
                        snippet.isLiked 
                          ? 'text-red-500' 
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${snippet.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{snippet.likesCount || 0}</span>
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
                        snippet.isBookmarked 
                          ? 'text-blue-500' 
                          : 'text-gray-500 hover:text-blue-500'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${snippet.isBookmarked ? 'fill-current' : ''}`} />
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

            {/* Code Block */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Code</h2>
                </div>
                <CodeEditor
                  value={snippet.content}
                  onChange={() => {}} // Read-only
                  language={snippet.language}
                  height="500px"
                  readOnly={true}
                  theme="vs-dark"
                />
              </div>
            </div>

            {/* Preview */}
            {showPreview && canPreview && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-green-500" />
                    Live Preview
                  </h3>
                </div>
                <div className="p-6">
                  <iframe
                    srcDoc={snippet.content}
                    className="w-full h-96 border rounded-lg"
                    sandbox="allow-scripts"
                    title="Code Preview"
                  />
                </div>
              </div>
            )}

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
                            <p className="text-gray-700">{comment.content}</p>
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
            {/* Author Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="text-center">
                  <Link to={`/u/${snippet.author.username}`}>
                    <img
                      src={snippet.author.avatar}
                      alt={snippet.author.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4"
                    />
                  </Link>
                  <h3 className="text-lg font-semibold text-gray-900">{snippet.author.name}</h3>
                  <p className="text-gray-500 mb-4">@{snippet.author.username}</p>
                  {snippet.author.bio && (
                    <p className="text-sm text-gray-600 mb-4">{snippet.author.bio}</p>
                  )}
                  <Link
                    to={`/u/${snippet.author.username}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    <span className="font-medium">{snippet.viewsCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Likes</span>
                    <span className="font-medium">{snippet.likesCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comments</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bookmarks</span>
                    <span className="font-medium">{snippet.bookmarksCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Snippets */}
            {snippet.relatedSnippets && snippet.relatedSnippets.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Snippets</h3>
                  <div className="space-y-3">
                    {snippet.relatedSnippets.slice(0, 3).map((related: any) => (
                      <Link
                        key={related.id}
                        to={`/snippets/${related.id}`}
                        className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900 mb-1">{related.title}</h4>
                        <p className="text-sm text-gray-600">{related.language}</p>
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