import { LoaderFunctionArgs, json, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useActionData } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

interface Bug {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  assignee?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  environment?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  _count: {
    comments: number;
  };
  tags: string[];
  comments?: Comment[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

interface LoaderData {
  user: any;
  bug: Bug;
  canEdit: boolean;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const { id } = params;

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/bugs/${id}`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Response("Bug not found", { status: 404 });
    }

    const bug = await response.json();
    const canEdit = user.id === bug.author.id || user.role === 'admin' || user.role === 'moderator';

    return json({ user, bug, canEdit });
  } catch (error) {
    throw new Response("Bug not found", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const { id } = params;
  
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    if (action === "updateStatus") {
      const status = formData.get("status");
      const response = await fetch(`${BACKEND_URL}/api/bugs/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie || "",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        return { error: "Failed to update bug status" };
      }

      return { success: "Bug status updated" };
    }

    if (action === "assignUser") {
      const assigneeId = formData.get("assigneeId");
      const response = await fetch(`${BACKEND_URL}/api/bugs/${id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie || "",
        },
        credentials: "include",
        body: JSON.stringify({ assigneeId }),
      });

      if (!response.ok) {
        return { error: "Failed to assign bug" };
      }

      return { success: "Bug assigned successfully" };
    }

    if (action === "addComment") {
      const content = formData.get("content");
      const response = await fetch(`${BACKEND_URL}/api/bugs/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie || "",
        },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        return { error: "Failed to add comment" };
      }

      return { success: "Comment added" };
    }

    if (action === "delete") {
      const response = await fetch(`${BACKEND_URL}/api/bugs/${id}`, {
        method: "DELETE",
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return { error: "Failed to delete bug" };
      }

      return { success: "Bug deleted", redirect: "/bugs" };
    }

    return { error: "Invalid action" };
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function BugView() {
  const { user, bug, canEdit } = useLoaderData<LoaderData>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/bugs"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bug Reports
          </Link>
          {canEdit && (
            <div className="flex space-x-2">
              <Link
                to={`/bugs/${bug.id}/edit`}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </Link>
              <Form method="post" className="inline">
                <input type="hidden" name="_action" value="delete" />
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to delete this bug report?')) {
                      e.preventDefault();
                    }
                  }}
                >
                  Delete
                </button>
              </Form>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <StatusBadge status={bug.status} />
          <PriorityBadge priority={bug.priority} />
          <span className="text-sm text-gray-500">#{bug.id.slice(0, 8)}</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{bug.title}</h1>
      </div>

      {/* Action Messages */}
      {actionData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{actionData.error}</div>
        </div>
      )}

      {actionData?.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{actionData.success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bug Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bug Description</h2>
            <p className="text-gray-700 mb-6 whitespace-pre-wrap">{bug.description}</p>

            {bug.stepsToReproduce && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">Steps to Reproduce</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{bug.stepsToReproduce}</pre>
                </div>
              </div>
            )}

            {bug.expectedBehavior && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">Expected Behavior</h3>
                <div className="bg-green-50 rounded-md p-4">
                  <p className="text-sm text-gray-700">{bug.expectedBehavior}</p>
                </div>
              </div>
            )}

            {bug.actualBehavior && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">Actual Behavior</h3>
                <div className="bg-red-50 rounded-md p-4">
                  <p className="text-sm text-gray-700">{bug.actualBehavior}</p>
                </div>
              </div>
            )}

            {bug.environment && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">Environment</h3>
                <div className="bg-blue-50 rounded-md p-4">
                  <p className="text-sm text-gray-700">{bug.environment}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {bug.tags.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {bug.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/bugs?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Comments ({bug._count.comments})
            </h2>

            {/* Add Comment Form */}
            <Form method="post" className="mb-6">
              <input type="hidden" name="_action" value="addComment" />
              <div>
                <label htmlFor="content" className="sr-only">Add a comment</label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Add a comment..."
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Add Comment
                </button>
              </div>
            </Form>

            {/* Comments List */}
            <div className="space-y-4">
              {bug.comments?.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-center mb-2">
                    <img
                      className="h-8 w-8 rounded-full"
                      src={comment.author.avatar}
                      alt={comment.author.name}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{comment.author.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 ml-11 whitespace-pre-wrap">{comment.content}</p>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bug Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bug Information</h3>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Reported by</dt>
                <dd className="mt-1 flex items-center">
                  <img
                    className="h-6 w-6 rounded-full"
                    src={bug.author.avatar}
                    alt={bug.author.name}
                  />
                  <span className="ml-2 text-sm text-gray-900">{bug.author.name}</span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(bug.createdAt).toLocaleDateString()}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(bug.updatedAt).toLocaleDateString()}
                </dd>
              </div>

              {bug.assignee && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                  <dd className="mt-1 flex items-center">
                    <img
                      className="h-6 w-6 rounded-full"
                      src={bug.assignee.avatar}
                      alt={bug.assignee.name}
                    />
                    <span className="ml-2 text-sm text-gray-900">{bug.assignee.name}</span>
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Status Management */}
          {canEdit && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Bug</h3>
              
              {/* Update Status */}
              <Form method="post" className="mb-4">
                <input type="hidden" name="_action" value="updateStatus" />
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={bug.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  type="submit"
                  className="mt-2 w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Update Status
                </button>
              </Form>

              {/* Assign User */}
              <Form method="post">
                <input type="hidden" name="_action" value="assignUser" />
                <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to
                </label>
                <input
                  type="text"
                  id="assigneeId"
                  name="assigneeId"
                  placeholder="User ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
                <button
                  type="submit"
                  className="mt-2 w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Assign Bug
                </button>
              </Form>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/bugs/new"
                className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Report New Bug
              </Link>
              <Link
                to="/bugs"
                className="block w-full text-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                View All Bugs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    open: 'bg-red-100 text-red-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
      {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[priority as keyof typeof colors]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
    </span>
  );
}