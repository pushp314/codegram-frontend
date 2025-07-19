import { LoaderFunctionArgs, json, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useActionData } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  website?: string;
  location?: string;
  skills: string[];
  interests: string[];
  joinedAt: string;
  isPublic: boolean;
  allowFollows: boolean;
  _count: {
    followers: number;
    following: number;
    snippets: number;
    docs: number;
    bugs: number;
  };
  isFollowing?: boolean;
  snippets: any[];
  docs: any[];
}

interface LoaderData {
  user: any;
  profile: UserProfile;
  isOwnProfile: boolean;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const { username } = params;

  if (!username) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${username}`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Response("User not found", { status: 404 });
    }

    const profile = await response.json();
    const isOwnProfile = user.username === username;

    return json({ user, profile, isOwnProfile });
  } catch (error) {
    throw new Response("User not found", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const { username } = params;
  
  if (!username) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    if (action === "follow" || action === "unfollow") {
      const method = action === "follow" ? "POST" : "DELETE";
      const response = await fetch(`${BACKEND_URL}/api/users/${username}/follow`, {
        method,
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return { error: `Failed to ${action} user` };
      }

      return { success: `User ${action}ed successfully` };
    }

    return { error: "Invalid action" };
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function UserProfile() {
  const { user, profile, isOwnProfile } = useLoaderData<LoaderData>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <img
            className="w-24 h-24 rounded-full"
            src={profile.avatar}
            alt={profile.name}
          />
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-600">@{profile.username}</p>
                {profile.location && (
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.location}
                  </p>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {profile.website}
                  </a>
                )}
              </div>
              
              <div className="flex space-x-3 mt-4 sm:mt-0">
                {isOwnProfile ? (
                  <Link
                    to="/profile/edit"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  profile.allowFollows && (
                    <Form method="post">
                      <input
                        type="hidden"
                        name="_action"
                        value={profile.isFollowing ? "unfollow" : "follow"}
                      />
                      <button
                        type="submit"
                        className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md ${
                          profile.isFollowing
                            ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {profile.isFollowing ? 'Unfollow' : 'Follow'}
                      </button>
                    </Form>
                  )
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-700 mt-4">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex space-x-6 mt-4 text-sm">
              <div>
                <span className="font-semibold text-gray-900">{profile._count.followers}</span>
                <span className="text-gray-500"> followers</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{profile._count.following}</span>
                <span className="text-gray-500"> following</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{profile._count.snippets}</span>
                <span className="text-gray-500"> snippets</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{profile._count.docs}</span>
                <span className="text-gray-500"> docs</span>
              </div>
            </div>

            {/* Skills */}
            {profile.skills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              Joined {new Date(profile.joinedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
              Snippets ({profile._count.snippets})
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Documentation ({profile._count.docs})
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Activity
            </button>
          </nav>
        </div>

        {/* Snippets Tab Content */}
        <div className="p-6">
          {profile.snippets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No snippets yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isOwnProfile ? "Start by creating your first snippet." : `${profile.name} hasn't shared any snippets yet.`}
              </p>
              {isOwnProfile && (
                <div className="mt-6">
                  <Link
                    to="/snippets/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Snippet
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.snippets.map((snippet: any) => (
                <div key={snippet.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    <Link to={`/snippets/${snippet.id}`} className="hover:text-blue-600">
                      {snippet.title}
                    </Link>
                  </h4>
                  {snippet.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{snippet.description}</p>
                  )}
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <pre className="text-xs text-gray-800 overflow-x-auto">
                      <code>{snippet.content.substring(0, 100)}{snippet.content.length > 100 ? '...' : ''}</code>
                    </pre>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">{snippet.language}</span>
                    <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}