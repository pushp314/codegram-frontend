import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    const response = await fetch(`${BACKEND_URL}/api/docs`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    const docs = response.ok ? await response.json() : [];
    return json({ docs });
  } catch (error) {
    return json({ docs: [] });
  }
}

export default function DocsIndex() {
  const { docs } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          <p className="text-gray-600 mt-1">Browse and manage project documentation</p>
        </div>
        <Link
          to="/docs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          Create Doc
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc: any) => (
          <Link
            key={doc.id}
            to={`/docs/${doc.id}`}
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{doc.content?.substring(0, 150)}...</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>By {doc.author.name}</span>
              <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>

      {docs.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documentation yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first documentation.</p>
        </div>
      )}
    </div>
  );
}