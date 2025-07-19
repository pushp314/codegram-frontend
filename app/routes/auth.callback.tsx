import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getUserFromSession } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  
  if (!code) {
    return redirect("/?error=auth_failed");
  }

  try {
    // Let backend handle the OAuth callback
    const response = await fetch(`${BACKEND_URL}/api/auth/github/callback${url.search}`, {
      credentials: "include",
      headers: {
        "Cookie": request.headers.get("Cookie") || "",
      },
    });

    if (!response.ok) {
      return redirect("/?error=auth_failed");
    }

    // Get the user data to check if they need onboarding
    const user = await getUserFromSession(request);
    
    if (user) {
      // Check if user needs onboarding (no bio or incomplete profile)
      if (!user.bio || user.isNewUser) {
        return redirect("/onboarding");
      }
      return redirect("/home");
    }
    
    return redirect("/?error=auth_failed");
  } catch (error) {
    console.error("Auth callback error:", error);
    return redirect("/?error=auth_failed");
  }
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}