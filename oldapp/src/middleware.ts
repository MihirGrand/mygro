import { NextResponse, type NextRequest } from "next/server";

export default async function authMiddleware(request: NextRequest) {
  // Skip middleware for API routes completely
  // if (request.nextUrl.pathname.startsWith("/api/")) {
  //   return NextResponse.next();
  // }
  // Public paths that don't require authentication
  // const publicPaths = [
  //   "/sign-in",
  //   "/sign-up",
  //   "/report",
  //   "/pending-verification",
  // ];
  // const isPublicPath = publicPaths.some((path) =>
  //   request.nextUrl.pathname.startsWith(path),
  // );
  // Skip middleware for public paths
  // if (isPublicPath) {
  //   return NextResponse.next();
  // }
  //   try {
  //     // Check if user cookie exists
  //     const userCookie = request.cookies.get("user");
  //     // If no user cookie, redirect to sign-in
  //     if (!userCookie || !userCookie.value) {
  //       const signInUrl = new URL("/sign-in", request.url);
  //       signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  //       return NextResponse.redirect(signInUrl);
  //     }
  //     // Try to parse user data
  //     try {
  //       const userData = JSON.parse(userCookie.value);
  //       if (!userData.id || !userData.role) {
  //         // Invalid user data, redirect to sign-in
  //         const signInUrl = new URL("/sign-in", request.url);
  //         return NextResponse.redirect(signInUrl);
  //       }
  //       // Web app is only for ADMIN, INSPECTOR, and OWNER
  //       if (
  //         userData.role !== "ADMIN" &&
  //         userData.role !== "INSPECTOR" &&
  //         userData.role !== "OWNER"
  //       ) {
  //         const signInUrl = new URL("/sign-in", request.url);
  //         signInUrl.searchParams.set(
  //           "error",
  //           "Access denied. Web app is only for Admin, Inspector, and Owner users.",
  //         );
  //         return NextResponse.redirect(signInUrl);
  //       }
  //       // Check if inspector is verified
  //       if (userData.role === "INSPECTOR" && !userData.isVerified) {
  //         const pendingUrl = new URL("/pending-verification", request.url);
  //         return NextResponse.redirect(pendingUrl);
  //       }
  //     } catch (parseError) {
  //       // Cookie is corrupted, redirect to sign-in
  //       const signInUrl = new URL("/sign-in", request.url);
  //       return NextResponse.redirect(signInUrl);
  //     }
  //     // User is authenticated and has correct role, allow access
  //     return NextResponse.next();
  //   } catch (error) {
  //     console.error("Auth middleware error:", error);
  //     // In case of error, redirect to sign-in
  //     const signInUrl = new URL("/sign-in", request.url);
  //     return NextResponse.redirect(signInUrl);
  //   }
  // }
  //
}

export const config = {
  matcher: [
    // Match all paths except static files and favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
