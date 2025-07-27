"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, AlertCircle, Shield } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requireAdmin = false, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || status === "loading") return

    // Check for error messages from middleware redirects
    const error = searchParams.get("error")
    if (error === "admin_required") {
      toast.error("Admin access required for this page")
      // Clear the error from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      window.history.replaceState({}, "", newUrl.toString())
    }

    // Redirect to login if not authenticated
    if (!session) {
      const callbackUrl = encodeURIComponent(window.location.href)
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    // Check admin requirement
    if (requireAdmin && session.user?.role !== "ADMIN") {
      toast.error("Admin privileges required to access this page")
      router.push("/")
      return
    }
  }, [session, status, router, mounted, searchParams, requireAdmin])

  // Show loading state while checking authentication
  if (!mounted || status === "loading") {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Checking Authentication
              </h2>
              <p className="text-sm text-gray-600 text-center">
                Please wait while we verify your session...
              </p>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Show error state if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-600 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              You need to be logged in to access this page.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if admin required but user is not admin
  if (requireAdmin && session.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-8 w-8 text-orange-600 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Admin Access Required
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              You need administrator privileges to access this page.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render children if all checks pass
  return <>{children}</>
}

// Higher-order component for page-level protection
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAdmin?: boolean } = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard requireAdmin={options.requireAdmin}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}

// Hook for checking authentication status in components
export function useAuthGuard(requireAdmin = false) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isAuthenticated = status === "authenticated" && !!session
  const isAdmin = isAuthenticated && session.user?.role === "ADMIN"
  const isLoading = status === "loading"

  const redirectToLogin = (callbackUrl?: string) => {
    const url = callbackUrl 
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login"
    router.push(url)
  }

  const checkAccess = () => {
    if (!isAuthenticated) {
      redirectToLogin(window.location.href)
      return false
    }

    if (requireAdmin && !isAdmin) {
      toast.error("Admin privileges required")
      router.push("/")
      return false
    }

    return true
  }

  return {
    session,
    isAuthenticated,
    isAdmin,
    isLoading,
    redirectToLogin,
    checkAccess,
  }
}
