import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ExerciseSnapshotService } from "@/services/exercise-snapshot.service"

// GET /api/schedule/today - Get today's scheduled exercises
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Get today's schedule with current exercise data (not snapshots)
    const schedule = await ExerciseSnapshotService.getTodaysSchedule(dayOfWeek)

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error fetching today's schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch today's schedule" },
      { status: 500 }
    )
  }
}
