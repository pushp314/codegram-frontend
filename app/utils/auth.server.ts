import { redirect } from "@remix-run/node";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function getUserFromSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Cookie: cookie || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function requireAuth(request: Request) {
  const user = await getUserFromSession(request);
  
  if (!user) {
    throw redirect("/login");
  }
  
  return user;
}

export async function redirectIfAuthenticated(request: Request) {
  const user = await getUserFromSession(request);
  
  if (user) {
    throw redirect("/dashboard");
  }
}