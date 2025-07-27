import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { additionalExercises } from "@/data/additional-exercises"

// POST /api/admin/exercises/import-local - Import exercises from local data (admin only)
export async function POST() {
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

    let imported = 0
    let skipped = 0

    for (const exerciseData of additionalExercises) {
      try {
        // Check if exercise already exists
        const existingExercise = await prisma.exercise.findFirst({
          where: {
            name: exerciseData.name,
            userId: null // Only check global exercises
          }
        })

        if (existingExercise) {
          skipped++
          continue
        }

        // Create the exercise
        await prisma.exercise.create({
          data: exerciseData
        })

        imported++
      } catch (error) {
        console.error(`Error importing exercise ${exerciseData.name}:`, error)
        skipped++
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${imported} exercises from local database`,
      imported,
      skipped,
      total: additionalExercises.length
    })

  } catch (error) {
    console.error("Error importing local exercises:", error)
    return NextResponse.json(
      { error: "Failed to import exercises" },
      { status: 500 }
    )
  }
}
