import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const testSwapSchema = z.object({
  fromDay: z.number().min(0).max(6),
  toDay: z.number().min(0).max(6)
})

// POST /api/debug/test-swap - Test swap logic without authentication
export async function POST(request: NextRequest) {
  try {
    console.log("=== DEBUG TEST SWAP ===")
    
    const body = await request.json()
    console.log("Request body:", body)
    
    const validatedData = testSwapSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Check if schedules exist
    const schedules = await prisma.weeklySchedule.findMany({
      where: {
        dayOfWeek: {
          in: [validatedData.fromDay, validatedData.toDay]
        }
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    console.log("Found schedules:", schedules.map(s => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      name: s.name,
      exerciseCount: s.exercises.length
    })))

    const fromDaySchedule = schedules.find(s => s.dayOfWeek === validatedData.fromDay)
    const toDaySchedule = schedules.find(s => s.dayOfWeek === validatedData.toDay)

    return NextResponse.json({
      success: true,
      fromDaySchedule: fromDaySchedule ? {
        id: fromDaySchedule.id,
        dayOfWeek: fromDaySchedule.dayOfWeek,
        name: fromDaySchedule.name,
        exerciseCount: fromDaySchedule.exercises.length
      } : null,
      toDaySchedule: toDaySchedule ? {
        id: toDaySchedule.id,
        dayOfWeek: toDaySchedule.dayOfWeek,
        name: toDaySchedule.name,
        exerciseCount: toDaySchedule.exercises.length
      } : null,
      allSchedules: schedules.map(s => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        name: s.name,
        exerciseCount: s.exercises.length
      }))
    })

  } catch (error) {
    console.error("Debug test swap error:", error)
    return NextResponse.json(
      { 
        error: "Test failed",
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
