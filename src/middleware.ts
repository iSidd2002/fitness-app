import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Allow access to login, signup pages and auth-related routes
    if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/register")) {
      return NextResponse.next()
    }

    // Check if user is authenticated
    if (!token) {
      // Store the attempted URL for redirect after login
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", req.url)
      return NextResponse.redirect(loginUrl)
    }

    // Check admin routes
    if (pathname.startsWith("/admin")) {
      if (token.role !== "ADMIN") {
        // Redirect non-admin users to main dashboard with error message
        const homeUrl = new URL("/", req.url)
        homeUrl.searchParams.set("error", "admin_required")
        return NextResponse.redirect(homeUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow access to login, signup and auth routes
        if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/register")) {
          return true
        }

        // For admin routes, require admin role
        if (pathname.startsWith("/admin")) {
          return token?.role === "ADMIN"
        }

        // For all other routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ]
}
