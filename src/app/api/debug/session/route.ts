import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/debug/session - Debug session information (production-gated)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (process.env.NODE_ENV === "production" && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      hasSession: !!session,
      userId: session?.user?.id || null,
      userRole: session?.user?.role || null,
      userEmail: session?.user?.email || null,
      sessionData: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: session.user?.role
        }
      } : null
    })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json(
      { error: "Failed to get session", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
