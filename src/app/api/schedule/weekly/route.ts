import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/schedule/weekly - Get the full weekly schedule for users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const schedule = await prisma.weeklySchedule.findMany({
      include: {
        exercises: {
          include: {
            exercise: {
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
            }
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

    // Filter out deleted exercises and format the response
    const filteredSchedule = schedule.map(day => ({
      ...day,
      exercises: day.exercises.filter(ex => ex.exercise && !ex.exercise.isDeleted)
    }))

    return NextResponse.json({ schedule: filteredSchedule })
  } catch (error) {
    console.error("Error fetching weekly schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly schedule" },
      { status: 500 }
    )
  }
}
