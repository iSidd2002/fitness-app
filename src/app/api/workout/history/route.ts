import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ExerciseSnapshotService } from "@/services/exercise-snapshot.service"

// GET /api/workout/history - Get user's workout history
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's workout logs using snapshot service for historical accuracy
    const workoutLogs = await ExerciseSnapshotService.getWorkoutHistory(session.user.id)

    return NextResponse.json({ workoutLogs })
  } catch (error) {
    console.error("Error fetching workout history:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout history" },
      { status: 500 }
    )
  }
}
