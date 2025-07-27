import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/schedule/status - Check if weekly schedule is initialized
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const scheduleCount = await prisma.weeklySchedule.count()
    const schedules = await prisma.weeklySchedule.findMany({
      select: {
        id: true,
        dayOfWeek: true,
        name: true,
        _count: {
          select: {
            exercises: true
          }
        }
      },
      orderBy: {
        dayOfWeek: 'asc'
      }
    })

    return NextResponse.json({
      initialized: scheduleCount === 7,
      scheduleCount,
      schedules,
      missingDays: Array.from({ length: 7 }, (_, i) => i).filter(
        day => !schedules.find(s => s.dayOfWeek === day)
      )
    })
  } catch (error) {
    console.error("Error checking schedule status:", error)
    return NextResponse.json(
      { error: "Failed to check schedule status" },
      { status: 500 }
    )
  }
}
