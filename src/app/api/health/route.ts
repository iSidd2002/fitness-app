import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/health - Health check endpoint for debugging production issues
export async function GET() {
  try {
    console.log("=== HEALTH CHECK START ===")
    
    // Check environment
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT_SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT_SET"
    }
    console.log("Environment:", env)
    
    // Check database connection
    let dbStatus = "UNKNOWN"
    let scheduleCount = 0
    try {
      scheduleCount = await prisma.weeklySchedule.count()
      dbStatus = "CONNECTED"
      console.log("Database: Connected, schedules:", scheduleCount)
    } catch (dbError) {
      dbStatus = "ERROR"
      console.error("Database error:", dbError)
    }
    
    // Check session (if available)
    let sessionStatus = "UNKNOWN"
    let sessionInfo = null
    try {
      const session = await getServerSession(authOptions)
      sessionStatus = session ? "VALID" : "NO_SESSION"
      sessionInfo = session ? {
        userId: session.user?.id,
        email: session.user?.email,
        role: session.user?.role
      } : null
      console.log("Session:", sessionStatus, sessionInfo)
    } catch (sessionError) {
      sessionStatus = "ERROR"
      console.error("Session error:", sessionError)
    }
    
    const healthData = {
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: env,
      database: {
        status: dbStatus,
        scheduleCount
      },
      session: {
        status: sessionStatus,
        info: sessionInfo
      }
    }
    
    console.log("Health check result:", healthData)
    return NextResponse.json(healthData)
    
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      { 
        status: "ERROR",
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
