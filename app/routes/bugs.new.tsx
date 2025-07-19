import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  const bugData = {
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    tags: formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [],
    environment: formData.get("environment"),
    stepsToReproduce: formData.get("stepsToReproduce"),
    expectedBehavior: formData.get("expectedBehavior"),
    actualBehavior: formData.get("actualBehavior"),
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/bugs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie || "",
      },
      credentials: "include",
      body: JSON.stringify(bugData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to create bug report" };
    }

    const bug = await response.json();
    return redirect(`/bugs/${bug.id}`);
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function NewBugReport() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Report a Bug</h1>
          <p className="text-gray-600 mt-1">Help us improve by reporting issues you've encountered</p>
        </div>
        
        <Form method="post" className="p-6 space-y-6">
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{actionData.error}</div>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Bug Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Provide a clear, descriptive title for the bug"
            />
            <p className="text-sm text-gray-500 mt-1">Be specific and concise (e.g., "Login button not working on mobile devices")</p>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              id="priority"
              name="priority"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select priority</option>
              <option value="low">Low - Minor issue that doesn't affect functionality</option>
              <option value="medium">Medium - Issue that affects some functionality</option>
              <option value="high">High - Issue that significantly affects functionality</option>
              <option value="critical">Critical - Issue that breaks core functionality</option>
            </select>
          </div>

          {/* Environment */}
          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-2">
              Environment
            </label>
            <input
              type="text"
              id="environment"
              name="environment"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Browser version, OS, device type, etc."
            />
            <p className="text-sm text-gray-500 mt-1">e.g., "Chrome 120.0.0.0, macOS Ventura, iPhone 14"</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Bug Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Provide a detailed description of the bug..."
            />
            <p className="text-sm text-gray-500 mt-1">Describe what happened and what went wrong</p>
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700 mb-2">
              Steps to Reproduce *
            </label>
            <textarea
              id="stepsToReproduce"
              name="stepsToReproduce"
              required
              rows={6}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="1. Go to the login page
2. Enter valid credentials
3. Click the login button
4. Notice that..."
            />
            <p className="text-sm text-gray-500 mt-1">List the exact steps to reproduce the issue, numbered and detailed</p>
          </div>

          {/* Expected Behavior */}
          <div>
            <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Behavior *
            </label>
            <textarea
              id="expectedBehavior"
              name="expectedBehavior"
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="What should have happened?"
            />
            <p className="text-sm text-gray-500 mt-1">Describe what you expected to happen</p>
          </div>

          {/* Actual Behavior */}
          <div>
            <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-2">
              Actual Behavior *
            </label>
            <textarea
              id="actualBehavior"
              name="actualBehavior"
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="What actually happened?"
            />
            <p className="text-sm text-gray-500 mt-1">Describe what actually happened instead</p>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter tags separated by commas (e.g., login, mobile, ui)"
            />
            <p className="text-sm text-gray-500 mt-1">Tags help categorize and find bugs</p>
          </div>

          {/* Character Counts */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Description: {description.length} characters</p>
            <p>Steps to reproduce: {stepsToReproduce.length} characters</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Bug Report"}
            </button>
          </div>
        </Form>
      </div>

      {/* Bug Report Guidelines */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bug Report Guidelines</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Before submitting:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Search existing bug reports to avoid duplicates</li>
              <li>Try to reproduce the bug consistently</li>
              <li>Gather relevant screenshots or error messages</li>
              <li>Test in different environments if possible</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Writing effective bug reports:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use clear, specific titles that summarize the issue</li>
              <li>Provide detailed steps that anyone can follow</li>
              <li>Include your environment details (browser, OS, device)</li>
              <li>Explain what you expected vs. what actually happened</li>
              <li>Attach screenshots or recordings when helpful</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Priority levels:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Critical:</strong> Breaks core functionality, security issues</li>
              <li><strong>High:</strong> Significant impact on user experience</li>
              <li><strong>Medium:</strong> Moderate impact, workarounds available</li>
              <li><strong>Low:</strong> Minor issues, cosmetic problems</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}