import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  // If user already has a complete profile, redirect to home
  if (user.bio && !user.isNewUser) {
    return redirect("/home");
  }
  
  return { user };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  const onboardingData = {
    bio: formData.get("bio"),
    website: formData.get("website"),
    location: formData.get("location"),
    skills: formData.get("skills")?.toString().split(",").map(skill => skill.trim()).filter(Boolean) || [],
    interests: formData.getAll("interests"),
    experience: formData.get("experience"),
    isPublic: formData.get("isPublic") === "on",
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie || "",
      },
      credentials: "include",
      body: JSON.stringify(onboardingData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to complete onboarding" };
    }

    return redirect("/home");
  } catch (error) {
    console.error("Onboarding error:", error);
    return { error: "Network error. Please try again." };
  }
}

export default function Onboarding() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const interests = [
    "Frontend Development", "Backend Development", "Full Stack", "Mobile Development",
    "DevOps", "Machine Learning", "Data Science", "UI/UX Design", "Game Development",
    "Blockchain", "Cybersecurity", "Cloud Computing", "Open Source"
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Welcome to CodeGram! 🎉
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Let's set up your developer profile to get started
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Form method="post" className="space-y-8">
            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800">{actionData.error}</div>
              </div>
            )}

            {/* User Info Display */}
            <div className="text-center pb-6 border-b border-gray-200">
              <img
                className="mx-auto h-24 w-24 rounded-full ring-4 ring-blue-100"
                src={user.avatar}
                alt={user.name}
              />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>

            {/* Bio Section */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Tell us about yourself *
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="I'm a passionate developer who loves creating amazing applications..."
              />
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                id="experience"
                name="experience"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select your experience level</option>
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="experienced">Experienced (3-5 years)</option>
                <option value="senior">Senior (5+ years)</option>
              </select>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What are you interested in? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interests.map((interest) => (
                  <div key={interest}>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        name="interests"
                        value={interest}
                        checked={selectedInterests.includes(interest)}
                        onChange={() => toggleInterest(interest)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">{interest}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                Your Skills
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="JavaScript, React, Node.js, Python, Docker (comma-separated)"
              />
              <p className="mt-1 text-xs text-gray-500">Separate skills with commas</p>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website/Portfolio
              </label>
              <input
                type="url"
                id="website"
                name="website"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://your-portfolio.com"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="San Francisco, CA"
              />
            </div>

            {/* Privacy Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <input
                  id="isPublic"
                  name="isPublic"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-3 text-sm text-gray-700">
                  Make my profile public (others can discover and follow you)
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting up your profile...
                  </>
                ) : (
                  "Complete Setup & Enter CodeGram 🚀"
                )}
              </button>
            </div>
          </Form>
        </div>

        <p className="text-center text-sm text-gray-500">
          You can always update your profile later in settings
        </p>
      </div>
    </div>
  );
}