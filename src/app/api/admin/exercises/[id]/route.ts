import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { ExerciseUpdateService } from "@/services/exercise-update.service"
import { RealTimeUpdateService } from "@/services/realtime-update.service"

const updateExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required").optional(),
  description: z.string().optional(),
  muscleGroup: z.string().min(1, "Muscle group is required").optional(),
  equipment: z.string().min(1, "Equipment is required").optional(),
  videoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
})

// PUT /api/admin/exercises/[id] - Update an exercise (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const exerciseId = params.id
    const body = await request.json()
    const validatedData = updateExerciseSchema.parse(body)

    // Remove empty strings and undefined values
    const updates = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => 
        value !== undefined && value !== ""
      )
    )

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    // Update the exercise with audit trail
    const updatedExercise = await ExerciseUpdateService.updateExercise(
      exerciseId,
      updates,
      session.user.id
    )

    // Notify about the update (for real-time features)
    await RealTimeUpdateService.notifyExerciseUpdate(exerciseId, updatedExercise)

    return NextResponse.json({
      message: "Exercise updated successfully",
      exercise: updatedExercise
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating exercise:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update exercise" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/exercises/[id] - Delete an exercise (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const exerciseId = params.id

    // Soft delete the exercise (preserves data integrity)
    const result = await ExerciseUpdateService.softDeleteExercise(
      exerciseId,
      session.user.id
    )

    // Notify about the deletion
    if (result.exercise) {
      await RealTimeUpdateService.notifyExerciseDeleted(
        exerciseId, 
        result.exercise.name
      )
    }

    return NextResponse.json({
      message: "Exercise deleted successfully",
      deletionType: result.deletionType,
      reason: result.reason,
      exercise: result.exercise
    })

  } catch (error) {
    console.error("Error deleting exercise:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete exercise" },
      { status: 500 }
    )
  }
}

// GET /api/admin/exercises/[id] - Get exercise details with usage stats (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const exerciseId = params.id

    // Get exercise details and usage statistics
    const [usageStats, changeHistory] = await Promise.all([
      ExerciseUpdateService.getExerciseUsageStats(exerciseId),
      ExerciseUpdateService.getExerciseChangeHistory(exerciseId)
    ])

    return NextResponse.json({
      exerciseId,
      usageStats,
      changeHistory: changeHistory.slice(0, 10) // Last 10 changes
    })

  } catch (error) {
    console.error("Error fetching exercise details:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch exercise details" },
      { status: 500 }
    )
  }
}
