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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/painel")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (
    !user &&
    request.nextUrl.pathname.startsWith("/cliente") &&
    request.nextUrl.pathname !== "/cliente/login"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/cliente/login";
    return NextResponse.redirect(url);
  }

  // A client_access account is a read-only viewer, never an agency —
  // bounce it out of the agency dashboard even if it somehow signs in there.
  if (user?.email && request.nextUrl.pathname.startsWith("/painel")) {
    const { data: clientAccess } = await supabase
      .from("client_access")
      .select("id")
      .eq("email", user.email)
      .limit(1)
      .maybeSingle();
    if (clientAccess) {
      const url = request.nextUrl.clone();
      url.pathname = "/cliente";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
