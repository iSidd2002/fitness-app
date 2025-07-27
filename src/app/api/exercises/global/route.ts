import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/exercises/global - Get all global exercises (for admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch global exercises (userId is null)
    const exercises = await prisma.exercise.findMany({
      where: {
        userId: null // Global exercises only
      },
      orderBy: [
        { muscleGroup: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error("Error fetching global exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    )
  }
}
