import { LoaderFunctionArgs, ActionFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";
import { 
  UserPlus, 
  UserMinus, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Code, 
  FileText, 
  Users, 
  Heart,
  Eye,
  Settings
} from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const currentUser = await requireAuth(request);
  const { username } = params;
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const [profileRes, contentRes, followersRes, followingRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/users/${username}`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/users/${username}/content`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/users/${username}/followers`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
      fetch(`${BACKEND_URL}/api/users/${username}/following`, {
        headers: { Cookie: cookie || "" },
        credentials: "include",
      }),
    ]);

    if (!profileRes.ok) {
      throw new Response("User not found", { status: 404 });
    }

    const profile = await profileRes.json();
    const content = contentRes.ok ? await contentRes.json() : { snippets: [], docs: [] };
    const followers = followersRes.ok ? await followersRes.json() : { data: [] };
    const following = followingRes.ok ? await followingRes.json() : { data: [] };

    return json({ 
      profile, 
      content, 
      followers, 
      following, 
      currentUser,
      isOwnProfile: currentUser.id === profile.id 
    });
  } catch (error) {
    throw new Response("User not found", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const currentUser = await requireAuth(request);
  const { username } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    if (intent === "follow" || intent === "unfollow") {
      const response = await fetch(`${BACKEND_URL}/api/users/${username}/follow`, {
        method: intent === "follow" ? "POST" : "DELETE",
        headers: { Cookie: cookie || "" },
        credentials: "include",
      });

      if (!response.ok) {
        return json({ error: "Failed to update follow status" }, { status: 400 });
      }

      return json({ success: true });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return json({ error: "Network error" }, { status: 500 });
  }
}

export default function UserProfile() {
  const { profile, content, followers, following, currentUser, isOwnProfile } = useLoaderData<typeof loader>();
  const followFetcher = useFetcher();
  const [activeTab, setActiveTab] = useState("snippets");

  const handleFollow = () => {
    followFetcher.submit(
      { intent: profile.isFollowing ? "unfollow" : "follow" },
      { method: "post" }
    );
  };

  const tabs = [
    { id: "snippets", label: "Code Snippets", icon: Code, count: content.snippets?.length || 0 },
    { id: "docs", label: "Documentation", icon: FileText, count: content.docs?.length || 0 },
    { id: "followers", label: "Followers", icon: Users, count: followers.data?.length || 0 },
    { id: "following", label: "Following", icon: UserPlus, count: following.data?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover/Banner Area */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-16 mb-6">
              <div className="flex items-end space-x-6">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
                <div className="pb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-lg text-gray-600">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-gray-700 mt-2 max-w-2xl">{profile.bio}</p>
                  )}
                </div>
              </div>
              
              <div className="ml-auto pb-4">
                {isOwnProfile ? (
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Link>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followFetcher.state === "submitting"}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                      profile.isFollowing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {profile.isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
              {profile.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center space-x-1">
                  <LinkIcon className="w-4 h-4" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{content.snippets?.length || 0}</div>
                <div className="text-sm text-gray-600">Snippets</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{content.docs?.length || 0}</div>
                <div className="text-sm text-gray-600">Docs</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{followers.data?.length || 0}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{following.data?.length || 0}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "snippets" && (
              <div className="space-y-4">
                {content.snippets && content.snippets.length > 0 ? (
                  content.snippets.map((snippet: any) => (
                    <SnippetCard key={snippet.id} snippet={snippet} />
                  ))
                ) : (
                  <EmptyState
                    icon={Code}
                    title="No snippets yet"
                    description={
                      isOwnProfile
                        ? "Share your first code snippet with the community!"
                        : `${profile.name} hasn't shared any snippets yet.`
                    }
                    action={
                      isOwnProfile ? (
                        <Link
                          to="/snippets/new"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Create Snippet
                        </Link>
                      ) : null
                    }
                  />
                )}
              </div>
            )}

            {activeTab === "docs" && (
              <div className="space-y-4">
                {content.docs && content.docs.length > 0 ? (
                  content.docs.map((doc: any) => (
                    <DocCard key={doc.id} doc={doc} />
                  ))
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No documentation yet"
                    description={
                      isOwnProfile
                        ? "Write your first documentation to help others learn!"
                        : `${profile.name} hasn't written any documentation yet.`
                    }
                    action={
                      isOwnProfile ? (
                        <Link
                          to="/docs/new"
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Write Documentation
                        </Link>
                      ) : null
                    }
                  />
                )}
              </div>
            )}

            {activeTab === "followers" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followers.data && followers.data.length > 0 ? (
                  followers.data.map((follower: any) => (
                    <UserCard key={follower.id} user={follower} />
                  ))
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No followers yet"
                    description={
                      isOwnProfile
                        ? "Share great content to attract followers!"
                        : `${profile.name} doesn't have any followers yet.`
                    }
                  />
                )}
              </div>
            )}

            {activeTab === "following" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {following.data && following.data.length > 0 ? (
                  following.data.map((user: any) => (
                    <UserCard key={user.id} user={user} />
                  ))
                ) : (
                  <EmptyState
                    icon={UserPlus}
                    title="Not following anyone yet"
                    description={
                      isOwnProfile
                        ? "Discover and follow amazing developers!"
                        : `${profile.name} isn't following anyone yet.`
                    }
                    action={
                      isOwnProfile ? (
                        <Link
                          to="/explore?type=users"
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Find Developers
                        </Link>
                      ) : null
                    }
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SnippetCard({ snippet }: { snippet: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <Link to={`/snippets/${snippet.id}`} className="block">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
          {snippet.title}
        </h3>
        {snippet.description && (
          <p className="text-gray-600 mb-3">{snippet.description}</p>
        )}
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <Heart className="w-4 h-4" />
            <span>{snippet.likesCount || 0}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{snippet.viewsCount || 0}</span>
          </span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
            {snippet.language}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(snippet.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function DocCard({ doc }: { doc: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <Link to={`/docs/${doc.id}`} className="block">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
          {doc.title}
        </h3>
        {doc.description && (
          <p className="text-gray-600 mb-3">{doc.description}</p>
        )}
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <Heart className="w-4 h-4" />
            <span>{doc.likesCount || 0}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{doc.viewsCount || 0}</span>
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(doc.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <Link to={`/u/${user.username}`} className="block">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  action?: React.ReactNode; 
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {action}
    </div>
  );
}