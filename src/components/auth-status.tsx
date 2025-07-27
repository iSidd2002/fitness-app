"use client"

import { useSession } from "next-auth/react"
import { Shield, User, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (process.env.NODE_ENV === "production") {
    return null // Don't show in production
  }

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "authenticated":
        return <User className="h-4 w-4 text-green-600" />
      case "unauthenticated":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "bg-yellow-50 border-yellow-200"
      case "authenticated":
        return "bg-green-50 border-green-200"
      case "unauthenticated":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-80 z-50 ${getStatusColor()}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          {getStatusIcon()}
          <span>Auth Status (Dev Mode)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Status:</span>
          <Badge variant={status === "authenticated" ? "default" : status === "loading" ? "secondary" : "destructive"}>
            {status}
          </Badge>
        </div>
        
        {session && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">User:</span>
              <span className="text-xs truncate max-w-32">{session.user?.name || session.user?.email}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Role:</span>
              <Badge variant={session.user?.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
                {session.user?.role || "USER"}
              </Badge>
            </div>
            
            {session.user?.role === "ADMIN" && (
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">Admin Access Granted</span>
              </div>
            )}
          </>
        )}
        
        {status === "unauthenticated" && (
          <div className="text-xs text-red-600">
            User not authenticated - should redirect to login
          </div>
        )}
        
        {status === "loading" && (
          <div className="text-xs text-yellow-600">
            Checking authentication status...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
