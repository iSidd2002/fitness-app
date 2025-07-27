import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ExerciseUpdateService } from "@/services/exercise-update.service"
import { RealTimeUpdateService } from "@/services/realtime-update.service"

// POST /api/admin/exercises/[id]/restore - Restore a soft-deleted exercise (admin only)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const params = await context.params
    const exerciseId = params.id

    // Restore the exercise
    const restoredExercise = await ExerciseUpdateService.restoreExercise(
      exerciseId,
      session.user.id
    )

    // Notify about the restoration
    const exerciseForNotification = {
      ...restoredExercise,
      description: restoredExercise.description || undefined,
      videoUrl: restoredExercise.videoUrl || undefined,
      userId: restoredExercise.userId || undefined
    }
    await RealTimeUpdateService.notifyExerciseRestored(exerciseId, exerciseForNotification)

    return NextResponse.json({
      message: "Exercise restored successfully",
      exercise: restoredExercise
    })

  } catch (error) {
    console.error("Error restoring exercise:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to restore exercise" },
      { status: 500 }
    )
  }
}
