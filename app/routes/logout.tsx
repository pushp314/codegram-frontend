import { ActionFunctionArgs, redirect } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Cookie: cookie || "",
    },
    credentials: "include",
  });
  
  return redirect("/");
}

export async function loader() {
  return redirect("/");
}