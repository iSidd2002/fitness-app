import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/admin/schedule/[id] - Remove exercise from schedule
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await context.params
    const scheduleExerciseId = params.id

    // Get the schedule exercise to find its order and schedule
    const scheduleExercise = await prisma.scheduleExercise.findUnique({
      where: { id: scheduleExerciseId },
      include: { schedule: true }
    })

    if (!scheduleExercise) {
      return NextResponse.json(
        { error: "Schedule exercise not found" },
        { status: 404 }
      )
    }

    // Delete the schedule exercise
    await prisma.scheduleExercise.delete({
      where: { id: scheduleExerciseId }
    })

    // Reorder remaining exercises
    await prisma.scheduleExercise.updateMany({
      where: {
        scheduleId: scheduleExercise.scheduleId,
        order: { gt: scheduleExercise.order }
      },
      data: {
        order: { decrement: 1 }
      }
    })

    return NextResponse.json(
      { message: "Exercise removed from schedule" },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error removing exercise from schedule:", error)
    return NextResponse.json(
      { error: "Failed to remove exercise from schedule" },
      { status: 500 }
    )
  }
}
