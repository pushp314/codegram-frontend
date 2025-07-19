import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireAuth } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const snippetId = formData.get("snippetId");
  const content = formData.get("content");
  
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  try {
    switch (intent) {
      case "like":
        const likeResponse = await fetch(`${BACKEND_URL}/api/snippets/${snippetId}/like`, {
          method: "POST",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        return json({ success: true, data: await likeResponse.json() });
        
      case "bookmark":
        const bookmarkResponse = await fetch(`${BACKEND_URL}/api/snippets/${snippetId}/bookmark`, {
          method: "POST",
          headers: { Cookie: cookie || "" },
          credentials: "include",
        });
        return json({ success: true, data: await bookmarkResponse.json() });
        
      case "comment":
        const commentResponse = await fetch(`${BACKEND_URL}/api/snippets/${snippetId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie || "",
          },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
        return json({ success: true, data: await commentResponse.json() });
        
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return json({ error: "Action failed" }, { status: 500 });
  }
}