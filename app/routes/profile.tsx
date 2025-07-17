import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { requireAuth } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  // Redirect to the user's profile page
  return redirect(`/profile/${user.username}`);
}