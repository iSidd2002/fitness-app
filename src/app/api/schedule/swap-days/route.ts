import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const swapDaysSchema = z.object({
  fromDay: z.number().min(0).max(6),
  toDay: z.number().min(0).max(6),
  userId: z.string().min(1)
})

// POST /api/schedule/swap-days - Swap workout schedules between two days
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Swap request body:", body)

    const validatedData = swapDaysSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Verify the user is swapping their own schedule or is an admin
    if (validatedData.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log(`Looking for schedules: fromDay=${validatedData.fromDay}, toDay=${validatedData.toDay}`)

    // Get both day schedules
    const [fromDaySchedule, toDaySchedule] = await Promise.all([
      prisma.weeklySchedule.findUnique({
        where: { dayOfWeek: validatedData.fromDay },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' }
          }
        }
      }),
      prisma.weeklySchedule.findUnique({
        where: { dayOfWeek: validatedData.toDay },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' }
          }
        }
      })
    ])

    console.log("Schedule lookup results:", {
      fromDaySchedule: fromDaySchedule ? { id: fromDaySchedule.id, name: fromDaySchedule.name, exerciseCount: fromDaySchedule.exercises.length } : null,
      toDaySchedule: toDaySchedule ? { id: toDaySchedule.id, name: toDaySchedule.name, exerciseCount: toDaySchedule.exercises.length } : null
    })

    if (!fromDaySchedule || !toDaySchedule) {
      console.error("Missing schedules:", { fromDaySchedule: !!fromDaySchedule, toDaySchedule: !!toDaySchedule })
      return NextResponse.json(
        {
          error: "One or both day schedules not found",
          details: {
            fromDayFound: !!fromDaySchedule,
            toDayFound: !!toDaySchedule,
            fromDay: validatedData.fromDay,
            toDay: validatedData.toDay
          }
        },
        { status: 404 }
      )
    }

    // Perform the swap in a transaction
    await prisma.$transaction(async (tx) => {
      // Get all exercises from both days
      const fromDayExercises = fromDaySchedule.exercises
      const toDayExercises = toDaySchedule.exercises

      // Delete all existing schedule exercises for both days
      await tx.scheduleExercise.deleteMany({
        where: {
          scheduleId: {
            in: [fromDaySchedule.id, toDaySchedule.id]
          }
        }
      })

      // Swap the workout names
      await tx.weeklySchedule.update({
        where: { id: fromDaySchedule.id },
        data: { name: toDaySchedule.name }
      })

      await tx.weeklySchedule.update({
        where: { id: toDaySchedule.id },
        data: { name: fromDaySchedule.name }
      })

      // Create new schedule exercises with swapped assignments
      // Move fromDay exercises to toDay
      for (const exercise of fromDayExercises) {
        await tx.scheduleExercise.create({
          data: {
            scheduleId: toDaySchedule.id,
            exerciseId: exercise.exerciseId,
            order: exercise.order
          }
        })
      }

      // Move toDay exercises to fromDay
      for (const exercise of toDayExercises) {
        await tx.scheduleExercise.create({
          data: {
            scheduleId: fromDaySchedule.id,
            exerciseId: exercise.exerciseId,
            order: exercise.order
          }
        })
      }
    })

    // Log the swap for audit purposes
    console.log(`Day swap completed: ${validatedData.fromDay} ↔ ${validatedData.toDay} for user ${validatedData.userId}`)

    return NextResponse.json({
      message: "Days swapped successfully",
      swappedDays: {
        fromDay: validatedData.fromDay,
        toDay: validatedData.toDay,
        fromDayName: toDaySchedule.name, // Now assigned to fromDay
        toDayName: fromDaySchedule.name   // Now assigned to toDay
      }
    })

  } catch (error) {
    console.error("Error swapping days:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to swap days",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
