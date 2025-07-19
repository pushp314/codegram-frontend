import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useNavigation, useLoaderData } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

interface LoaderData {
  user: any;
  accountSettings: {
    twoFactorEnabled: boolean;
    emailNotifications: boolean;
    marketingEmails: boolean;
    securityAlerts: boolean;
    lastPasswordChange?: string;
    connectedAccounts: {
      github: {
        connected: boolean;
        username?: string;
        connectedAt?: string;
      };
    };
    sessions: {
      id: string;
      device: string;
      location: string;
      lastActive: string;
      current: boolean;
    }[];
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const response = await fetch(`${BACKEND_URL}/api/users/account-settings`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const accountSettings = response.ok ? await response.json() : {
      twoFactorEnabled: false,
      emailNotifications: true,
      marketingEmails: false,
      securityAlerts: true,
      connectedAccounts: {
        github: {
          connected: true,
          username: user.username,
          connectedAt: user.createdAt
        }
      },
      sessions: [
        {
          id: "current",
          device: "Current Session",
          location: "Unknown",
          lastActive: new Date().toISOString(),
          current: true
        }
      ]
    };

    return json({ user, accountSettings });
  } catch (error) {
    return json({ 
      user, 
      accountSettings: {
        twoFactorEnabled: false,
        emailNotifications: true,
        marketingEmails: false,
        securityAlerts: true,
        connectedAccounts: {
          github: {
            connected: true,
            username: user.username,
            connectedAt: user.createdAt
          }
        },
        sessions: [
          {
            id: "current",
            device: "Current Session",
            location: "Unknown",
            lastActive: new Date().toISOString(),
            current: true
          }
        ]
      }
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const action = formData.get("_action");

  try {
    if (action === "updateNotifications") {
      const notificationData = {
        emailNotifications: formData.get("emailNotifications") === "on",
        marketingEmails: formData.get("marketingEmails") === "on",
        securityAlerts: formData.get("securityAlerts") === "on",
      };

      const response = await fetch(`${BACKEND_URL}/api/users/notification-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie || "",
        },
        credentials: "include",
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        return { error: "Failed to update notification settings" };
      }

      return { success: "Notification settings updated successfully" };
    }

    if (action === "enable2FA") {
      const response = await fetch(`${BACKEND_URL}/api/users/2fa/enable`, {
        method: "POST",
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return { error: "Failed to enable two-factor authentication" };
      }

      return { success: "Two-factor authentication enabled" };
    }

    if (action === "disable2FA") {
      const response = await fetch(`${BACKEND_URL}/api/users/2fa/disable`, {
        method: "POST",
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return { error: "Failed to disable two-factor authentication" };
      }

      return { success: "Two-factor authentication disabled" };
    }

    if (action === "revokeSession") {
      const sessionId = formData.get("sessionId");
      const response = await fetch(`${BACKEND_URL}/api/users/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return { error: "Failed to revoke session" };
      }

      return { success: "Session revoked successfully" };
    }

    if (action === "revokeAllSessions") {
      const response = await fetch(`${BACKEND_URL}/api/users/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: cookie || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return { error: "Failed to revoke all sessions" };
      }

      return { success: "All sessions revoked successfully" };
    }

    return { error: "Invalid action" };
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function SettingsAccount() {
  const { user, accountSettings } = useLoaderData<LoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account security and authentication settings</p>
      </div>

      {actionData?.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{actionData.error}</div>
        </div>
      )}

      {actionData?.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{actionData.success}</div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            <p className="text-xs text-gray-500 mt-1">Managed through GitHub OAuth</p>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Account Type</dt>
            <dd className="mt-1 text-sm text-gray-900">GitHub OAuth Account</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Member Since</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Account Status</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </dd>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>
          <div className="flex items-center">
            {accountSettings.twoFactorEnabled ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Disabled
              </span>
            )}
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {accountSettings.twoFactorEnabled ? "2FA is enabled" : "Enable 2FA for better security"}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {accountSettings.twoFactorEnabled 
                  ? "Your account is protected with two-factor authentication."
                  : "Protect your account by requiring a second form of authentication."
                }
              </p>
              <div className="mt-3">
                <Form method="post" className="inline">
                  <input 
                    type="hidden" 
                    name="_action" 
                    value={accountSettings.twoFactorEnabled ? "disable2FA" : "enable2FA"} 
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                      accountSettings.twoFactorEnabled
                        ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                        : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {accountSettings.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Connected Accounts</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">GitHub</h4>
                <p className="text-sm text-gray-600">
                  {accountSettings.connectedAccounts.github.connected 
                    ? `Connected as ${accountSettings.connectedAccounts.github.username}`
                    : "Not connected"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {accountSettings.connectedAccounts.github.connected ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              ) : (
                <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800">
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        
        <Form method="post">
          <input type="hidden" name="_action" value="updateNotifications" />
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="emailNotifications"
                  name="emailNotifications"
                  type="checkbox"
                  defaultChecked={accountSettings.emailNotifications}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                  Activity notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive emails about activity on your content (likes, comments, follows)
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="securityAlerts"
                  name="securityAlerts"
                  type="checkbox"
                  defaultChecked={accountSettings.securityAlerts}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="securityAlerts" className="text-sm font-medium text-gray-700">
                  Security alerts
                </label>
                <p className="text-sm text-gray-500">
                  Receive emails about important security events for your account
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="marketingEmails"
                  name="marketingEmails"
                  type="checkbox"
                  defaultChecked={accountSettings.marketingEmails}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="marketingEmails" className="text-sm font-medium text-gray-700">
                  Marketing emails
                </label>
                <p className="text-sm text-gray-500">
                  Receive emails about new features, tips, and CodeGram updates
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Notification Settings"}
            </button>
          </div>
        </Form>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
          <Form method="post" className="inline">
            <input type="hidden" name="_action" value="revokeAllSessions" />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              Revoke All Sessions
            </button>
          </Form>
        </div>
        
        <div className="space-y-4">
          {accountSettings.sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {session.device}
                  {session.current && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Current
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-600">{session.location}</p>
                <p className="text-xs text-gray-500">
                  Last active: {new Date(session.lastActive).toLocaleDateString()}
                </p>
              </div>
              {!session.current && (
                <Form method="post" className="inline">
                  <input type="hidden" name="_action" value="revokeSession" />
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Revoke
                  </button>
                </Form>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200">
        <div className="px-6 py-4 border-b border-red-200">
          <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete Account</h4>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              onClick={() => alert("Account deletion is not implemented in this demo")}
            >
              Delete Account
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Export Account Data</h4>
              <p className="text-sm text-gray-500">
                Download a copy of all your data including snippets, docs, and account information.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => alert("Data export is not implemented in this demo")}
            >
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}