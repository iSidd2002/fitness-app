import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/exercises/my - Get user's custom exercises
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's custom exercises
    const exercises = await prisma.exercise.findMany({
      where: {
        userId: session.user.id // User's custom exercises only
      },
      orderBy: [
        { muscleGroup: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error("Error fetching user's exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    )
  }
}
