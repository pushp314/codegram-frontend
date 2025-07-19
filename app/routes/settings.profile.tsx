import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useNavigation, useLoaderData } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";

interface LoaderData {
  user: any;
  profile: {
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
    isPublic: boolean;
    allowFollows: boolean;
    showEmail: boolean;
    showLocation: boolean;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    const profile = await response.json();
    return json({ user, profile });
  } catch (error) {
    // If we can't fetch the profile, use the user data we have
    return json({ 
      user, 
      profile: {
        ...user,
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        skills: user.skills || [],
        interests: user.interests || [],
        isPublic: user.isPublic ?? true,
        allowFollows: user.allowFollows ?? true,
        showEmail: user.showEmail ?? false,
        showLocation: user.showLocation ?? true,
      }
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  const profileData = {
    name: formData.get("name"),
    bio: formData.get("bio"),
    website: formData.get("website"),
    location: formData.get("location"),
    skills: formData.get("skills")?.toString().split(",").map(skill => skill.trim()).filter(Boolean) || [],
    interests: formData.get("interests")?.toString().split(",").map(interest => interest.trim()).filter(Boolean) || [],
    isPublic: formData.get("isPublic") === "on",
    allowFollows: formData.get("allowFollows") === "on",
    showEmail: formData.get("showEmail") === "on",
    showLocation: formData.get("showLocation") === "on",
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie || "",
      },
      credentials: "include",
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to update profile" };
    }

    return { success: "Profile updated successfully" };
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function SettingsProfile() {
  const { user, profile } = useLoaderData<LoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const [bio, setBio] = useState(profile.bio || "");
  const [skills, setSkills] = useState(profile.skills.join(", "));
  const [interests, setInterests] = useState(profile.interests.join(", "));
  
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600 mt-1">Manage your public profile information and visibility settings</p>
      </div>

      <Form method="post" className="space-y-6">
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

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          {/* Profile Picture */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-6">
              <img
                className="w-20 h-20 rounded-full"
                src={profile.avatar}
                alt={profile.name}
              />
              <div>
                <p className="text-sm text-gray-700 mb-1">
                  Your profile picture is automatically synced from your GitHub account.
                </p>
                <p className="text-xs text-gray-500">
                  To change it, update your GitHub profile picture and then log out and back in.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={profile.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                disabled
                defaultValue={profile.username}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell others about yourself..."
            />
            <p className="text-sm text-gray-500 mt-1">{bio.length}/300 characters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                defaultValue={profile.website}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-website.com"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                defaultValue={profile.location}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* Skills and Interests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skills & Interests</h3>
          
          {/* Skills */}
          <div className="mb-6">
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="JavaScript, React, Node.js, Python..."
            />
            <p className="text-sm text-gray-500 mt-1">Separate skills with commas. These help others find you.</p>
          </div>

          {/* Interests */}
          <div>
            <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
              Interests
            </label>
            <input
              type="text"
              id="interests"
              name="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Web Development, Machine Learning, Open Source..."
            />
            <p className="text-sm text-gray-500 mt-1">Separate interests with commas. These help personalize your experience.</p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Visibility</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isPublic"
                  name="isPublic"
                  type="checkbox"
                  defaultChecked={profile.isPublic}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                  Make my profile public
                </label>
                <p className="text-sm text-gray-500">
                  When enabled, other users can view your profile, snippets, and activity.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="allowFollows"
                  name="allowFollows"
                  type="checkbox"
                  defaultChecked={profile.allowFollows}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="allowFollows" className="text-sm font-medium text-gray-700">
                  Allow others to follow me
                </label>
                <p className="text-sm text-gray-500">
                  When enabled, other users can follow your activity and get updates about your content.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="showEmail"
                  name="showEmail"
                  type="checkbox"
                  defaultChecked={profile.showEmail}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="showEmail" className="text-sm font-medium text-gray-700">
                  Show email on profile
                </label>
                <p className="text-sm text-gray-500">
                  When enabled, your email address will be visible on your public profile.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="showLocation"
                  name="showLocation"
                  type="checkbox"
                  defaultChecked={profile.showLocation}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="showLocation" className="text-sm font-medium text-gray-700">
                  Show location on profile
                </label>
                <p className="text-sm text-gray-500">
                  When enabled, your location will be visible on your public profile.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Profile Settings"}
          </button>
        </div>
      </Form>

      {/* Profile Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Preview</h3>
        <p className="text-sm text-gray-600 mb-4">This is how your profile appears to other users:</p>
        
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start space-x-4">
            <img
              className="w-16 h-16 rounded-full"
              src={profile.avatar}
              alt={profile.name}
            />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">{profile.name}</h4>
              <p className="text-gray-600">@{profile.username}</p>
              {profile.showLocation && profile.location && (
                <p className="text-sm text-gray-500 mt-1">📍 {profile.location}</p>
              )}
              {bio && (
                <p className="text-gray-700 mt-2">{bio}</p>
              )}
              {profile.website && (
                <a href={profile.website} className="text-blue-600 hover:text-blue-800 text-sm mt-1 block">
                  🌐 {profile.website}
                </a>
              )}
              {profile.showEmail && (
                <p className="text-gray-600 text-sm mt-1">✉️ {profile.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}