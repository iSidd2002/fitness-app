import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const addExerciseSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  exerciseId: z.string().min(1),
  name: z.string().optional(),
})

// GET /api/admin/schedule - Get the weekly schedule
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const schedule = await prisma.weeklySchedule.findMany({
      include: {
        exercises: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        dayOfWeek: 'asc'
      }
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error fetching schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    )
  }
}

// POST /api/admin/schedule - Add exercise to schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addExerciseSchema.parse(body)

    // Find or create the weekly schedule for this day
    let weeklySchedule = await prisma.weeklySchedule.findUnique({
      where: { dayOfWeek: validatedData.dayOfWeek },
      include: { exercises: true }
    })

    if (!weeklySchedule) {
      weeklySchedule = await prisma.weeklySchedule.create({
        data: {
          dayOfWeek: validatedData.dayOfWeek,
          name: validatedData.name || `Day ${validatedData.dayOfWeek + 1}`
        },
        include: { exercises: true }
      })
    } else if (validatedData.name) {
      // Update the name if provided
      weeklySchedule = await prisma.weeklySchedule.update({
        where: { id: weeklySchedule.id },
        data: { name: validatedData.name },
        include: { exercises: true }
      })
    }

    // Check if exercise already exists in this day's schedule
    const existingExercise = weeklySchedule.exercises.find(
      ex => ex.exerciseId === validatedData.exerciseId
    )

    if (existingExercise) {
      return NextResponse.json(
        { error: "This exercise is already scheduled for this day" },
        { status: 400 }
      )
    }

    // Get the next order number
    const nextOrder = weeklySchedule.exercises.length + 1

    // Add the exercise to the schedule
    const scheduleExercise = await prisma.scheduleExercise.create({
      data: {
        scheduleId: weeklySchedule.id,
        exerciseId: validatedData.exerciseId,
        order: nextOrder
      },
      include: {
        exercise: true
      }
    })

    return NextResponse.json(
      { message: "Exercise added to schedule", scheduleExercise },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error adding exercise to schedule:", error)
    return NextResponse.json(
      { error: "Failed to add exercise to schedule" },
      { status: 500 }
    )
  }
}
