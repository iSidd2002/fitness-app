import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/test-session - Test session authentication
export async function GET() {
  try {
    console.log("=== TEST SESSION API ===")
    
    const session = await getServerSession(authOptions)
    console.log("Session result:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    })
    
    if (!session?.user?.id) {
      console.log("No session - returning 401")
      return NextResponse.json({ 
        error: "No session",
        authenticated: false
      }, { status: 401 })
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      },
      message: "Session is working correctly"
    })
    
  } catch (error) {
    console.error("Test session error:", error)
    return NextResponse.json(
      { 
        error: "Session test failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
