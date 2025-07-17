import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  // If user already has a bio, redirect to home (profile already set up)
  if (user.bio && user.bio.trim() !== '') {
    return redirect("/home");
  }
  
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  const profileData = {
    name: formData.get("name") || user.name,
    bio: formData.get("bio"),
    website: formData.get("website") || user.website,
    location: formData.get("location") || user.location,
    techStack: formData.get("techStack")?.toString().split(",").map(tech => tech.trim()).filter(Boolean) || [],
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
      return json({ error: error.error || "Failed to update profile" });
    }

    return redirect("/home");
  } catch (error) {
    return json({ error: "Network error. Please try again." });
  }
}

export default function ProfileSetup() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <img
                className="mx-auto h-20 w-20 rounded-full"
                src={user.avatar}
                alt={user.name}
              />
              <h1 className="mt-4 text-2xl font-bold text-gray-900">
                Welcome to CodeGram!
              </h1>
              <p className="mt-2 text-gray-600">
                Let's set up your profile to get started
              </p>
            </div>

            <Form method="post" className="space-y-6">
              {actionData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-800">{actionData.error}</div>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={user.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your display name"
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio *
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself as a developer..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  This will be displayed on your profile and helps others understand your background.
                </p>
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  defaultValue={user.website}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  defaultValue={user.location}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, Country"
                />
              </div>

              {/* Tech Stack */}
              <div>
                <label htmlFor="techStack" className="block text-sm font-medium text-gray-700 mb-2">
                  Tech Stack <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id="techStack"
                  name="techStack"
                  defaultValue={user.techStack?.join(", ")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="JavaScript, React, Node.js, Python..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter your technologies separated by commas.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? "Setting up..." : "Complete Setup"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}