import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ExerciseUpdateService } from "@/services/exercise-update.service"

const createGlobalExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  description: z.string().optional(),
  muscleGroup: z.string().min(1, "Muscle group is required"),
  equipment: z.string().min(1, "Equipment is required"),
  videoUrl: z.string().url().optional().or(z.literal("")),
  assignToDays: z.array(z.number()).optional(),
})

// POST /api/admin/exercises/create - Create a global exercise (admin only)
export async function POST(request: NextRequest) {
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
    const validatedData = createGlobalExerciseSchema.parse(body)

    // Check if exercise name already exists globally
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive' // Case-insensitive search
        },
        isDeleted: false
      }
    })

    if (existingExercise) {
      return NextResponse.json(
        { error: "An exercise with this name already exists" },
        { status: 400 }
      )
    }

    // Create the global exercise (no userId means it's global)
    const exercise = await ExerciseUpdateService.createExercise(
      {
        name: validatedData.name,
        description: validatedData.description,
        muscleGroup: validatedData.muscleGroup,
        equipment: validatedData.equipment,
        videoUrl: validatedData.videoUrl || undefined,
        // No userId - this makes it a global exercise
      },
      session.user.id // Admin who created it (for audit trail)
    )

    // If days are selected, assign the exercise to those days
    const assignedDays = []
    if (validatedData.assignToDays && validatedData.assignToDays.length > 0) {
      for (const dayOfWeek of validatedData.assignToDays) {
        try {
          // Find or create the weekly schedule for this day
          let weeklySchedule = await prisma.weeklySchedule.findUnique({
            where: { dayOfWeek },
            include: { exercises: true }
          })

          if (!weeklySchedule) {
            // Create the weekly schedule if it doesn't exist
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            weeklySchedule = await prisma.weeklySchedule.create({
              data: {
                dayOfWeek,
                name: dayNames[dayOfWeek]
              },
              include: { exercises: true }
            })
          }

          // Check if exercise is already assigned to this day
          const existingAssignment = await prisma.scheduleExercise.findFirst({
            where: {
              scheduleId: weeklySchedule.id,
              exerciseId: exercise.id
            }
          })

          if (!existingAssignment) {
            // Get the next order number for this day
            const maxOrder = weeklySchedule.exercises.length > 0
              ? Math.max(...weeklySchedule.exercises.map(ex => ex.order))
              : 0

            // Assign the exercise to this day
            await prisma.scheduleExercise.create({
              data: {
                scheduleId: weeklySchedule.id,
                exerciseId: exercise.id,
                order: maxOrder + 1
              }
            })

            assignedDays.push(dayOfWeek)
          }
        } catch (error) {
          console.error(`Error assigning exercise to day ${dayOfWeek}:`, error)
        }
      }
    }

    const message = assignedDays.length > 0
      ? `Global exercise created and assigned to ${assignedDays.length} day${assignedDays.length !== 1 ? 's' : ''}`
      : "Global exercise created successfully"

    return NextResponse.json(
      {
        message,
        exercise: {
          ...exercise,
          isGlobal: true,
          assignedDays
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Error creating global exercise:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    )
  }
}
