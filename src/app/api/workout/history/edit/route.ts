import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const editSetSchema = z.object({
  id: z.string(),
  reps: z.number().min(0).max(1000),
  weightKg: z.number().min(0).max(1000)
})

const editExerciseSchema = z.object({
  workoutExerciseId: z.string(),
  sets: z.array(editSetSchema)
})

const addExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.array(z.object({
    setNumber: z.number(),
    reps: z.number().min(0).max(1000),
    weightKg: z.number().min(0).max(1000)
  }))
})

const editWorkoutSchema = z.object({
  workoutLogId: z.string(),
  action: z.enum(['edit_sets', 'add_exercise', 'remove_exercise', 'delete_workout']),
  data: z.union([
    editExerciseSchema,
    addExerciseSchema,
    z.object({ workoutExerciseId: z.string() }),
    z.object({})
  ]).optional()
})

// PUT /api/workout/history/edit - Edit workout history
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = editWorkoutSchema.parse(body)

    // Verify workout belongs to user
    const workoutLog = await prisma.workoutLog.findFirst({
      where: {
        id: validatedData.workoutLogId,
        userId: session.user.id
      },
      include: {
        workoutExercises: {
          include: {
            sets: true,
            originalExercise: true,
            replacementExercise: true
          }
        }
      }
    })

    if (!workoutLog) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    let result

    switch (validatedData.action) {
      case 'edit_sets':
        result = await editExerciseSets(validatedData.data as any, session.user.id)
        break
      case 'add_exercise':
        result = await addExerciseToWorkout(validatedData.workoutLogId, validatedData.data as any, session.user.id)
        break
      case 'remove_exercise':
        result = await removeExerciseFromWorkout(validatedData.data as any, session.user.id)
        break
      case 'delete_workout':
        result = await deleteWorkout(validatedData.workoutLogId, session.user.id)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Create audit log
    await createAuditLog(session.user.id, validatedData.action, validatedData.workoutLogId, validatedData.data)

    return NextResponse.json({
      message: "Workout updated successfully",
      result
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error editing workout history:", error)
    return NextResponse.json(
      { error: "Failed to edit workout" },
      { status: 500 }
    )
  }
}

async function editExerciseSets(data: { workoutExerciseId: string; sets: Array<{ id: string; reps: number; weightKg: number }> }, userId: string) {
  const { workoutExerciseId, sets } = data

  // Verify workout exercise belongs to user
  const workoutExercise = await prisma.workoutExercise.findFirst({
    where: {
      id: workoutExerciseId,
      workoutLog: { userId }
    }
  })

  if (!workoutExercise) {
    throw new Error("Workout exercise not found")
  }

  // Update sets in transaction
  return await prisma.$transaction(async (tx) => {
    // Update existing sets
    for (const set of sets) {
      await tx.exerciseSet.update({
        where: { id: set.id },
        data: {
          reps: set.reps,
          weightKg: set.weightKg
        }
      })
    }

    return { updatedSets: sets.length }
  })
}

async function addExerciseToWorkout(workoutLogId: string, data: { exerciseId: string; sets: Array<{ setNumber: number; reps: number; weightKg: number }> }, _userId: string) {
  const { exerciseId, sets } = data

  // Verify exercise exists
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId }
  })

  if (!exercise) {
    throw new Error("Exercise not found")
  }

  return await prisma.$transaction(async (tx) => {
    // Create workout exercise
    const workoutExercise = await tx.workoutExercise.create({
      data: {
        workoutLogId,
        originalExerciseId: exerciseId,
        isCustom: false,
        isReplaced: false,
        order: 999 // Add at end
      }
    })

    // Create sets
    const createdSets = await Promise.all(
      sets.map((set: any) =>
        tx.exerciseSet.create({
          data: {
            workoutExerciseId: workoutExercise.id,
            setNumber: set.setNumber,
            reps: set.reps,
            weightKg: set.weightKg
          }
        })
      )
    )

    return {
      workoutExercise,
      sets: createdSets
    }
  })
}

async function removeExerciseFromWorkout(data: { workoutExerciseId: string }, userId: string) {
  const { workoutExerciseId } = data

  // Verify workout exercise belongs to user
  const workoutExercise = await prisma.workoutExercise.findFirst({
    where: {
      id: workoutExerciseId,
      workoutLog: { userId }
    }
  })

  if (!workoutExercise) {
    throw new Error("Workout exercise not found")
  }

  return await prisma.$transaction(async (tx) => {
    // Delete sets first
    await tx.exerciseSet.deleteMany({
      where: { workoutExerciseId }
    })

    // Delete workout exercise
    await tx.workoutExercise.delete({
      where: { id: workoutExerciseId }
    })

    return { deleted: true }
  })
}

async function deleteWorkout(workoutLogId: string, _userId: string) {
  return await prisma.$transaction(async (tx) => {
    // Get workout exercises
    const workoutExercises = await tx.workoutExercise.findMany({
      where: { workoutLogId }
    })

    // Delete all sets
    for (const we of workoutExercises) {
      await tx.exerciseSet.deleteMany({
        where: { workoutExerciseId: we.id }
      })
    }

    // Delete workout exercises
    await tx.workoutExercise.deleteMany({
      where: { workoutLogId }
    })

    // Delete workout log
    await tx.workoutLog.delete({
      where: { id: workoutLogId }
    })

    return { deleted: true }
  })
}

async function createAuditLog(userId: string, action: string, workoutLogId: string, data: unknown) {
  try {
    // Create a simple audit log in the database
    // You might want to create a separate AuditLog table for this
    console.log(`Audit: User ${userId} performed ${action} on workout ${workoutLogId}`, data)
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}
