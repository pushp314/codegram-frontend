import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireAuth } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");
  
  const formData = await request.formData();
  const action = formData.get('action');
  const contentType = formData.get('contentType');
  const contentId = formData.get('contentId');

  try {
    if (action === 'toggle-like') {
      const response = await fetch(`${BACKEND_URL}/api/likes/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie || "",
        },
        credentials: "include",
        body: JSON.stringify({
          [`${contentType}Id`]: contentId,
        }),
      });
      
      return json(await response.json());
    }
    
    if (action === 'toggle-bookmark') {
      const response = await fetch(`${BACKEND_URL}/api/bookmarks/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie || "",
        },
        credentials: "include",
        body: JSON.stringify({
          [`${contentType}Id`]: contentId,
        }),
      });
      
      return json(await response.json());
    }
    
    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return json({ error: 'Failed to perform action' }, { status: 500 });
  }
}