import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation } from "@remix-run/react";
import { requireAuth, getUserFromSession } from "~/utils/auth.server";
import { useState } from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const currentUser = await getUserFromSession(request);
  const username = params.username;
  
  if (!username) {
    throw new Response("Username required", { status: 400 });
  }

  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    // Fetch user profile
    const response = await fetch(`${BACKEND_URL}/api/users/${username}`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Response("User not found", { status: 404 });
    }

    const user = await response.json();

    // Fetch user's content
    const contentResponse = await fetch(`${BACKEND_URL}/api/users/${username}/content`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const content = contentResponse.ok ? await contentResponse.json() : {
      snippets: [],
      docs: [],
      bugs: []
    };

    return json({ user, content, currentUser });
  } catch (error) {
    throw new Response("Error fetching profile", { status: 500 });
  }
}

export default function UserProfile() {
  const { user, content, currentUser } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("snippets");
  
  const isOwnProfile = currentUser?.id === user.id;
  const isFollowing = user.isFollowing;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const tabs = [
    { id: "snippets", label: "Snippets", count: content.snippets.length },
    { id: "docs", label: "Docs", count: content.docs.length },
    { id: "bugs", label: "Bugs", count: content.bugs.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
              <p className="text-xl text-blue-100 mb-2">@{user.username}</p>
              <p className="text-lg text-white/90 mb-4 max-w-2xl">{user.bio}</p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {user.location}
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Joined {formatDate(user.createdAt)}
                </div>
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isOwnProfile ? (
                <Link
                  to="/profile/edit"
                  className="px-6 py-2 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors"
                >
                  Edit Profile
                </Link>
              ) : (
                <Form method="post" action={`/api/follow/${user.id}`}>
                  <button
                    type="submit"
                    className={`px-6 py-2 rounded-full font-medium transition-colors ${
                      isFollowing
                        ? "bg-white/20 text-white hover:bg-white/30"
                        : "bg-white text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </Form>
              )}
              <Link
                to={user.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-white/20 text-white rounded-full font-medium hover:bg-white/30 transition-colors"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-1">{user._count.snippets}</div>
            <div className="text-gray-600">Snippets</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-1">{user._count.followers}</div>
            <div className="text-gray-600">Followers</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-1">{user._count.following}</div>
            <div className="text-gray-600">Following</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-1">{user.publicRepos}</div>
            <div className="text-gray-600">Repositories</div>
          </div>
        </div>

        {/* Tech Stack */}
        {user.techStack && user.techStack.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {user.techStack.map((tech: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "snippets" && (
              <div className="space-y-4">
                {content.snippets.length > 0 ? (
                  content.snippets.map((snippet: any) => (
                    <div key={snippet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2">{snippet.title}</h4>
                      <p className="text-gray-600 mb-3">{snippet.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">{snippet.language}</span>
                          <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>❤️ {snippet._count.likes}</span>
                          <span>💬 {snippet._count.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No snippets yet
                  </div>
                )}
              </div>
            )}

            {activeTab === "docs" && (
              <div className="space-y-4">
                {content.docs.length > 0 ? (
                  content.docs.map((doc: any) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2">{doc.title}</h4>
                      <p className="text-gray-600 mb-3">{doc.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>❤️ {doc._count.likes}</span>
                          <span>💬 {doc._count.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No documentation yet
                  </div>
                )}
              </div>
            )}

            {activeTab === "bugs" && (
              <div className="space-y-4">
                {content.bugs.length > 0 ? (
                  content.bugs.map((bug: any) => (
                    <div key={bug.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2">{bug.title}</h4>
                      <p className="text-gray-600 mb-3">{bug.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            bug.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {bug.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(bug.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>❤️ {bug._count.likes}</span>
                          <span>💬 {bug._count.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No bugs reported yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}