import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
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
  _count: {
    comments: number;
  };
  tags: string[];
}

interface LoaderData {
  user: any;
  bugs: Bug[];
  totalBugs: number;
  currentPage: number;
  statusFilter: string;
  priorityFilter: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || "";
  const priority = url.searchParams.get("priority") || "";
  const limit = 15;

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("page", page.toString());
    searchParams.set("limit", limit.toString());
    if (status) searchParams.set("status", status);
    if (priority) searchParams.set("priority", priority);

    const response = await fetch(`${BACKEND_URL}/api/bugs?${searchParams}`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const data = response.ok ? await response.json() : { bugs: [], total: 0 };

    return json({
      user,
      bugs: data.bugs || [],
      totalBugs: data.total || 0,
      currentPage: page,
      statusFilter: status,
      priorityFilter: priority
    });
  } catch (error) {
    return json({
      user,
      bugs: [],
      totalBugs: 0,
      currentPage: 1,
      statusFilter: "",
      priorityFilter: ""
    });
  }
}

export default function BugsIndex() {
  const { user, bugs, totalBugs, currentPage, statusFilter, priorityFilter } = useLoaderData<LoaderData>();
  const totalPages = Math.ceil(totalBugs / 15);

  const statusCounts = {
    open: bugs.filter(b => b.status === 'open').length,
    'in-progress': bugs.filter(b => b.status === 'in-progress').length,
    resolved: bugs.filter(b => b.status === 'resolved').length,
    closed: bugs.filter(b => b.status === 'closed').length,
  };

  const priorityCounts = {
    critical: bugs.filter(b => b.priority === 'critical').length,
    high: bugs.filter(b => b.priority === 'high').length,
    medium: bugs.filter(b => b.priority === 'medium').length,
    low: bugs.filter(b => b.priority === 'low').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bug Reports</h1>
          <p className="text-gray-600 mt-1">Track and manage bug reports from the community</p>
        </div>
        <Link
          to="/bugs/new"
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-medium"
        >
          Report Bug
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">{totalBugs}</div>
          <div className="text-sm text-gray-500">Total Bugs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-red-600">{statusCounts.open}</div>
          <div className="text-sm text-gray-500">Open</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts['in-progress']}</div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600">{statusCounts.resolved}</div>
          <div className="text-sm text-gray-500">Resolved</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-2">
              <Link
                to="/bugs"
                className={`block px-3 py-2 text-sm rounded-md ${
                  !statusFilter ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All ({totalBugs})
              </Link>
              {Object.entries(statusCounts).map(([status, count]) => (
                <Link
                  key={status}
                  to={`/bugs?status=${status}`}
                  className={`block px-3 py-2 text-sm rounded-md ${
                    statusFilter === status ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{status.replace('-', ' ')}</span> ({count})
                </Link>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority</h3>
            <div className="space-y-2">
              <Link
                to={statusFilter ? `/bugs?status=${statusFilter}` : "/bugs"}
                className={`block px-3 py-2 text-sm rounded-md ${
                  !priorityFilter ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All
              </Link>
              {Object.entries(priorityCounts).map(([priority, count]) => (
                <Link
                  key={priority}
                  to={`/bugs?${statusFilter ? `status=${statusFilter}&` : ''}priority=${priority}`}
                  className={`block px-3 py-2 text-sm rounded-md ${
                    priorityFilter === priority ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{priority}</span> ({count})
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bug List */}
        <div className="lg:col-span-3 space-y-4">
          {bugs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bugs found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or report a new bug.</p>
              <div className="mt-6">
                <Link
                  to="/bugs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Report Bug
                </Link>
              </div>
            </div>
          ) : (
            bugs.map((bug) => (
              <div key={bug.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={bug.status} />
                    <PriorityBadge priority={bug.priority} />
                  </div>
                  <span className="text-sm text-gray-500">
                    #{bug.id.slice(0, 8)}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Link to={`/bugs/${bug.id}`} className="hover:text-red-600">
                    {bug.title}
                  </Link>
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{bug.description}</p>

                {/* Tags */}
                {bug.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bug.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <img
                        className="h-6 w-6 rounded-full"
                        src={bug.author.avatar}
                        alt={bug.author.name}
                      />
                      <span className="ml-2">{bug.author.name}</span>
                    </div>
                    {bug.assignee && (
                      <div className="flex items-center">
                        <span>Assigned to:</span>
                        <img
                          className="h-6 w-6 rounded-full ml-1"
                          src={bug.assignee.avatar}
                          alt={bug.assignee.name}
                        />
                        <span className="ml-1">{bug.assignee.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {bug._count.comments}
                    </span>
                    <span>Updated {new Date(bug.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              {currentPage > 1 && (
                <Link
                  to={`/bugs?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}${priorityFilter ? `&priority=${priorityFilter}` : ''}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <Link
                  to={`/bugs?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}${priorityFilter ? `&priority=${priorityFilter}` : ''}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          )}
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