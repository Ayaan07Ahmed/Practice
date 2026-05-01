import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [k, v] of Object.entries(headers ?? {})) {
            response.headers.set(k, v);
          }
        },
      },
    },
  );

  // IMPORTANT: must come before any rendering — touches cookies/refreshes session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    path === "/movies" ||
    path.startsWith("/movies/") ||
    path === "/watchlist" ||
    path.startsWith("/watchlist/") ||
    path === "/trending" ||
    path.startsWith("/trending/") ||
    path === "/discover" ||
    path.startsWith("/discover/") ||
    path === "/stats" ||
    path.startsWith("/stats/") ||
    path === "/profile" ||
    path.startsWith("/profile/");
  const isAuthRoute = path === "/login" || path === "/signup";

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/movies";
    return NextResponse.redirect(url);
  }

  return response;
}
