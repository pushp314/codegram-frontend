import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  const preferencesRes = await fetch(`${BACKEND_URL}/api/settings/preferences`, {
    headers: { Cookie: cookie || "" },
    credentials: "include"
  });
  const preferences = await preferencesRes.json();
  return json({ user, preferences });
}

export default function Settings() {
  const { user, preferences } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="mb-4">
        <Link to="/settings/profile" className="block text-blue-600 hover:underline mb-2">Edit Profile</Link>
        <Link to="/settings/account" className="block text-blue-600 hover:underline">Account Settings</Link>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Preferences</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(preferences, null, 2)}</pre>
      </div>
    </div>
  );
}