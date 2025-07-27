import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ExerciseSnapshotService } from "@/services/exercise-snapshot.service"

const exerciseSetSchema = z.object({
  setNumber: z.number(),
  reps: z.number(),
  weightKg: z.number(),
})

const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  isCustom: z.boolean(),
  order: z.number(),
  sets: z.array(exerciseSetSchema),
  originalExerciseId: z.string().optional(), // Track if exercise was replaced
  originalExerciseName: z.string().optional(), // Track original exercise name
})

const saveWorkoutSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  exercises: z.array(workoutExerciseSchema),
})

// POST /api/workout/save - Save a completed workout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = saveWorkoutSchema.parse(body)

    // Create the workout log
    const workoutLog = await prisma.workoutLog.create({
      data: {
        userId: session.user.id,
        dayOfWeek: validatedData.dayOfWeek,
        date: new Date(),
      }
    })

    // Add each exercise and its sets using snapshot pattern
    for (const exercise of validatedData.exercises) {
      // Only save exercises that have completed sets
      const completedSets = exercise.sets.filter(set => set.reps > 0 && set.weightKg > 0)

      if (completedSets.length > 0) {
        // Fetch current exercise data for snapshot
        const currentExercise = await prisma.exercise.findUnique({
          where: { id: exercise.exerciseId },
          select: {
            id: true,
            name: true,
            description: true,
            muscleGroup: true,
            equipment: true,
            videoUrl: true,
            userId: true,
            isDeleted: true
          }
        })

        if (!currentExercise) {
          console.warn(`Exercise ${exercise.exerciseId} not found, skipping`)
          continue
        }

        if (currentExercise.isDeleted) {
          console.warn(`Exercise ${exercise.exerciseId} is deleted, skipping`)
          continue
        }

        // Create workout exercise with snapshot
        const exerciseForSnapshot = {
          ...currentExercise,
          description: currentExercise.description || undefined,
          videoUrl: currentExercise.videoUrl || undefined,
          userId: currentExercise.userId || undefined
        }
        const workoutExercise = await ExerciseSnapshotService.saveWorkoutExercise(
          workoutLog.id,
          exerciseForSnapshot,
          exercise.order,
          !!exercise.originalExerciseId, // isReplaced
          exercise.originalExerciseId
        )

        // Add the sets
        for (const set of completedSets) {
          await prisma.exerciseSet.create({
            data: {
              workoutExerciseId: workoutExercise.id,
              setNumber: set.setNumber,
              reps: set.reps,
              weightKg: set.weightKg,
            }
          })
        }
      }
    }

    return NextResponse.json(
      { message: "Workout saved successfully", workoutLogId: workoutLog.id },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error saving workout:", error)
    return NextResponse.json(
      { error: "Failed to save workout" },
      { status: 500 }
    )
  }
}
