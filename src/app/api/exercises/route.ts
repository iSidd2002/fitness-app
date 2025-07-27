import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ExerciseUpdateService } from "@/services/exercise-update.service"
import { RealTimeUpdateService } from "@/services/realtime-update.service"

const createExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  description: z.string().optional(),
  muscleGroup: z.string().min(1, "Muscle group is required"),
  equipment: z.string().min(1, "Equipment is required"),
  videoUrl: z.string().url().optional().or(z.literal("")),
})

// GET /api/exercises - Fetch all exercises (global + user's custom)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch both global exercises (userId is null) and user's custom exercises
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { userId: null }, // Global exercises
          { userId: session.user.id }, // User's custom exercises
        ]
      },
      orderBy: [
        { userId: 'asc' }, // Global exercises first (null values come first)
        { name: 'asc' }
      ],
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    )
  }
}

// POST /api/exercises - Create a custom exercise
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createExerciseSchema.parse(body)

    // Check if exercise name already exists for this user or globally
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        name: validatedData.name,
        OR: [
          { userId: null }, // Global exercise with same name
          { userId: session.user.id }, // User's exercise with same name
        ]
      }
    })

    if (existingExercise) {
      return NextResponse.json(
        { error: "An exercise with this name already exists" },
        { status: 400 }
      )
    }

    // Create the custom exercise using the update service
    const exercise = await ExerciseUpdateService.createExercise(
      {
        name: validatedData.name,
        description: validatedData.description,
        muscleGroup: validatedData.muscleGroup,
        equipment: validatedData.equipment,
        videoUrl: validatedData.videoUrl || undefined,
        userId: session.user.id, // Mark as user's custom exercise
      },
      session.user.id
    )

    return NextResponse.json(
      { message: "Exercise created successfully", exercise },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating exercise:", error)
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    )
  }
}
