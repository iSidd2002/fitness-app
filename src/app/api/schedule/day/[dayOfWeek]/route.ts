import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ExerciseSnapshotService } from "@/services/exercise-snapshot.service"

// GET /api/schedule/day/[dayOfWeek] - Get specific day's scheduled exercises
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ dayOfWeek: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await context.params
    const dayOfWeek = parseInt(params.dayOfWeek)

    // Validate dayOfWeek parameter
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: "Invalid day of week. Must be 0-6 (Sunday-Saturday)" },
        { status: 400 }
      )
    }

    // Get the schedule for the specified day
    const schedule = await ExerciseSnapshotService.getTodaysSchedule(dayOfWeek)

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error fetching day schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch day schedule" },
      { status: 500 }
    )
  }
}
