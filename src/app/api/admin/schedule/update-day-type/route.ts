import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateDayTypeSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  newDayName: z.string().min(1).max(100),
})

// PUT /api/admin/schedule/update-day-type - Update workout type for a specific day
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateDayTypeSchema.parse(body)

    // Check if the day schedule exists
    const existingSchedule = await prisma.weeklySchedule.findUnique({
      where: { dayOfWeek: validatedData.dayOfWeek },
      include: {
        exercises: {
          include: { exercise: true }
        }
      }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Day schedule not found" },
        { status: 404 }
      )
    }

    // Update the day name
    const updatedSchedule = await prisma.weeklySchedule.update({
      where: { dayOfWeek: validatedData.dayOfWeek },
      data: { name: validatedData.newDayName },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    // Log the change for audit purposes
    console.log(`Day type updated: Day ${validatedData.dayOfWeek} changed from "${existingSchedule.name}" to "${validatedData.newDayName}" by admin ${session.user.id}`)

    return NextResponse.json({
      message: "Day type updated successfully",
      schedule: updatedSchedule,
      previousName: existingSchedule.name,
      newName: validatedData.newDayName,
      exerciseCount: existingSchedule.exercises.length
    })

  } catch (error) {
    console.error("Error updating day type:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update day type" },
      { status: 500 }
    )
  }
}
