import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ExerciseAPIService } from "@/services/exercise-api.service"

// POST /api/admin/exercises/import - Import exercises from external API (admin only)
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
    const { bodyPart, limit = 50 } = body

    let externalExercises
    
    if (bodyPart && bodyPart !== 'all') {
      // Import exercises for specific body part
      externalExercises = await ExerciseAPIService.fetchExercisesByBodyPart(bodyPart)
    } else {
      // Import all exercises (limited)
      externalExercises = await ExerciseAPIService.fetchAllExercises(limit)
    }

    if (externalExercises.length === 0) {
      return NextResponse.json({ 
        message: "No exercises found or API not configured",
        imported: 0,
        skipped: 0
      })
    }

    let imported = 0
    let skipped = 0

    for (const externalExercise of externalExercises) {
      try {
        // Check if exercise already exists
        const existingExercise = await prisma.exercise.findFirst({
          where: {
            name: externalExercise.name,
            userId: null // Only check global exercises
          }
        })

        if (existingExercise) {
          skipped++
          continue
        }

        // Convert to our database format
        const exerciseData = ExerciseAPIService.convertToDbFormat(externalExercise)

        // Create the exercise
        await prisma.exercise.create({
          data: exerciseData
        })

        imported++
      } catch (error) {
        console.error(`Error importing exercise ${externalExercise.name}:`, error)
        skipped++
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${imported} exercises`,
      imported,
      skipped,
      total: externalExercises.length
    })

  } catch (error) {
    console.error("Error importing exercises:", error)
    return NextResponse.json(
      { error: "Failed to import exercises" },
      { status: 500 }
    )
  }
}

// GET /api/admin/exercises/import - Get available body parts for import
export async function GET() {
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

    const bodyParts = ExerciseAPIService.getAvailableBodyParts()
    
    return NextResponse.json({ 
      bodyParts,
      apiConfigured: !!process.env.RAPIDAPI_KEY
    })

  } catch (error) {
    console.error("Error getting import options:", error)
    return NextResponse.json(
      { error: "Failed to get import options" },
      { status: 500 }
    )
  }
}
