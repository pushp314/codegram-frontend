import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link, Outlet, useLocation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

interface LoaderData {
  user: any;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  return json({ user });
}

export default function SettingsLayout() {
  const { user } = useLoaderData<LoaderData>();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'General',
      href: '/settings',
      icon: GeneralIcon,
      description: 'General account settings and preferences'
    },
    {
      name: 'Profile',
      href: '/settings/profile',
      icon: ProfileIcon,
      description: 'Manage your profile information'
    },
    {
      name: 'Account',
      href: '/settings/account',
      icon: AccountIcon,
      description: 'Account security and authentication'
    },
    {
      name: 'Notifications',
      href: '/settings/notifications',
      icon: NotificationsIcon,
      description: 'Email and push notification preferences'
    },
    {
      name: 'Privacy',
      href: '/settings/privacy',
      icon: PrivacyIcon,
      description: 'Privacy settings and data controls'
    }
  ];

  // If we're on the exact /settings route, show the general settings
  const isIndexRoute = location.pathname === '/settings';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = item.href === '/settings' 
                ? location.pathname === '/settings'
                : location.pathname.startsWith(item.href) && item.href !== '/settings';
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Quick Links */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Links</h3>
            <div className="space-y-2">
              <Link
                to={`/users/${user.username}`}
                className="block text-sm text-blue-700 hover:text-blue-900"
              >
                View Public Profile
              </Link>
              <Link
                to="/profile"
                className="block text-sm text-blue-700 hover:text-blue-900"
              >
                Edit Profile
              </Link>
              <Link
                to="/dashboard"
                className="block text-sm text-blue-700 hover:text-blue-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {isIndexRoute ? (
            <GeneralSettings user={user} />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Username</dt>
            <dd className="mt-1 text-sm text-gray-900">@{user.username}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Member since</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </dd>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/settings/profile"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <ProfileIcon className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Edit Profile</h3>
                <p className="text-xs text-gray-500">Update your profile information</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/settings/account"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <AccountIcon className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Account Security</h3>
                <p className="text-xs text-gray-500">Manage security settings</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/settings/notifications"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <NotificationsIcon className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">Configure notifications</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/settings/privacy"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <PrivacyIcon className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Privacy</h3>
                <p className="text-xs text-gray-500">Control your privacy settings</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <span className="text-gray-600">Logged in from new device</span>
            <span className="ml-auto text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
            <span className="text-gray-600">Updated profile information</span>
            <span className="ml-auto text-gray-400">1 day ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
            <span className="text-gray-600">Created new snippet</span>
            <span className="ml-auto text-gray-400">3 days ago</span>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-500">Snippets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-500">Documentation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">0</div>
            <div className="text-sm text-gray-500">Bug Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon components
function GeneralIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function NotificationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405C18.37 15.197 18 14.627 18 14V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3c0 .627-.37 1.197-.595 1.595L2 17h5m5 0v1a3 3 0 01-6 0v-1m6 0h-6" />
    </svg>
  );
}

function PrivacyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}