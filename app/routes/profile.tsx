import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const profileData = {
    bio: formData.get("bio"),
    website: formData.get("website"),
    location: formData.get("location"),
    skills: formData.get("skills")?.toString().split(",").map(skill => skill.trim()).filter(Boolean) || [],
  };
  try {
    const response = await fetch(`${BACKEND_URL}/api/settings/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie || "" },
      credentials: "include",
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to update profile" };
    }
    return json({ success: true });
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function ProfileEdit() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <Form method="post" className="space-y-4">
        {actionData && 'error' in actionData && actionData.error && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded">{actionData.error}</div>
        )}
        <label className="block">
          Bio
          <textarea name="bio" defaultValue={user.bio} className="mt-1 block w-full border rounded"/>
        </label>
        <label className="block">
          Website
          <input type="url" name="website" defaultValue={user.website} className="mt-1 block w-full border rounded"/>
        </label>
        <label className="block">
          Location
          <input type="text" name="location" defaultValue={user.location} className="mt-1 block w-full border rounded"/>
        </label>
        <label className="block">
          Skills (comma-separated)
          <input type="text" name="skills" defaultValue={user.skills?.join(", ")} className="mt-1 block w-full border rounded"/>
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </Form>
    </div>
  );
}