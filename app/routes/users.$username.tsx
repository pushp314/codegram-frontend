import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const { username } = params;
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  const [profileRes, contentRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/users/${username}`, {
      headers: { Cookie: cookie || "" },
      credentials: "include",
    }),
    fetch(`${BACKEND_URL}/api/users/${username}/content`, {
      headers: { Cookie: cookie || "" },
      credentials: "include",
    }),
  ]);
  const profile = await profileRes.json();
  const content = await contentRes.json();

  return json({ profile, content });
}

export default function UserProfile() {
  const { profile, content } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-6">
        <img src={profile.avatar} alt={profile.name} className="h-16 w-16 rounded-full"/>
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-gray-500">@{profile.username}</p>
          <p className="text-gray-600">{profile.bio}</p>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3">Snippets</h2>
        {content.snippets?.length === 0 ? (
          <p className="text-gray-500">No snippets yet.</p>
        ) : (
          <ul className="space-y-2">
            {content.snippets?.map((snippet: any) => (
              <li key={snippet.id} className="bg-white border rounded px-4 py-2">
                <div className="font-semibold">{snippet.title}</div>
                <div className="text-sm text-gray-500">{snippet.language}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}