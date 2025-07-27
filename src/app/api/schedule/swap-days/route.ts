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
    console.log("=== SWAP DAYS API START ===")
    console.log("Environment:", process.env.NODE_ENV)
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL)

    const session = await getServerSession(authOptions)
    console.log("Session result:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    })

    if (!session?.user?.id) {
      console.log("No session or user ID - returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = swapDaysSchema.parse(body)

    // Verify the user is swapping their own schedule or is an admin
    if (validatedData.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get both day schedules
    console.log("Fetching schedules for days:", validatedData.fromDay, "and", validatedData.toDay)

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

    console.log("Schedule fetch results:", {
      fromDayFound: !!fromDaySchedule,
      toDayFound: !!toDaySchedule,
      fromDayId: fromDaySchedule?.id,
      toDayId: toDaySchedule?.id
    })

    // Check if we need to create missing schedules
    let actualFromDaySchedule = fromDaySchedule
    let actualToDaySchedule = toDaySchedule

    if (!actualFromDaySchedule) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      actualFromDaySchedule = await prisma.weeklySchedule.create({
        data: {
          dayOfWeek: validatedData.fromDay,
          name: dayNames[validatedData.fromDay]
        },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' }
          }
        }
      })
    }

    if (!actualToDaySchedule) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      actualToDaySchedule = await prisma.weeklySchedule.create({
        data: {
          dayOfWeek: validatedData.toDay,
          name: dayNames[validatedData.toDay]
        },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' }
          }
        }
      })
    }

    // Perform the swap in a transaction
    console.log("Starting transaction...")
    await prisma.$transaction(async (tx) => {
      console.log("Inside transaction")
      // Get all exercises from both days
      const fromDayExercises = actualFromDaySchedule.exercises
      const toDayExercises = actualToDaySchedule.exercises

      console.log("Exercise counts:", {
        fromDayExercises: fromDayExercises.length,
        toDayExercises: toDayExercises.length
      })

      // Delete all existing schedule exercises for both days
      await tx.scheduleExercise.deleteMany({
        where: {
          scheduleId: {
            in: [actualFromDaySchedule.id, actualToDaySchedule.id]
          }
        }
      })

      // Swap the workout names
      await tx.weeklySchedule.update({
        where: { id: actualFromDaySchedule.id },
        data: { name: actualToDaySchedule.name }
      })

      await tx.weeklySchedule.update({
        where: { id: actualToDaySchedule.id },
        data: { name: actualFromDaySchedule.name }
      })

      // Create new schedule exercises with swapped assignments
      // Move fromDay exercises to toDay
      for (const exercise of fromDayExercises) {
        await tx.scheduleExercise.create({
          data: {
            scheduleId: actualToDaySchedule.id,
            exerciseId: exercise.exerciseId,
            order: exercise.order
          }
        })
      }

      // Move toDay exercises to fromDay
      for (const exercise of toDayExercises) {
        await tx.scheduleExercise.create({
          data: {
            scheduleId: actualFromDaySchedule.id,
            exerciseId: exercise.exerciseId,
            order: exercise.order
          }
        })
      }
    })

    console.log("Transaction completed successfully")

    return NextResponse.json({
      message: "Days swapped successfully",
      swappedDays: {
        fromDay: validatedData.fromDay,
        toDay: validatedData.toDay,
        fromDayName: actualToDaySchedule.name, // Now assigned to fromDay
        toDayName: actualFromDaySchedule.name   // Now assigned to toDay
      }
    })

  } catch (error) {
    console.error("Error swapping days:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    console.error("Error name:", error instanceof Error ? error.name : 'Unknown')
    console.error("Error cause:", error instanceof Error ? error.cause : 'No cause')

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to swap days",
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      },
      { status: 500 }
    )
  }
}
