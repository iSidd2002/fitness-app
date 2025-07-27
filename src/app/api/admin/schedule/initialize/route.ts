import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Default Bro Split Schedule
const defaultSchedule = [
  {
    dayOfWeek: 0, // Sunday - Rest/Cardio
    name: "Active Recovery (Cardio & Core)",
    exercises: []
  },
  {
    dayOfWeek: 1, // Monday - Push Day
    name: "Push Day (Chest, Shoulders, Triceps)",
    exercises: []
  },
  {
    dayOfWeek: 2, // Tuesday - Pull Day
    name: "Pull Day (Back, Biceps)",
    exercises: []
  },
  {
    dayOfWeek: 3, // Wednesday - Leg Day
    name: "Leg Day",
    exercises: []
  },
  {
    dayOfWeek: 4, // Thursday - Push Day
    name: "Push Day (Chest, Shoulders, Triceps)",
    exercises: []
  },
  {
    dayOfWeek: 5, // Friday - Pull Day
    name: "Pull Day (Back, Biceps)",
    exercises: []
  },
  {
    dayOfWeek: 6, // Saturday - Leg Day
    name: "Leg Day",
    exercises: []
  }
]

// POST /api/admin/schedule/initialize - Initialize weekly schedule (admin only)
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

    // Check if schedule already exists
    const existingSchedule = await prisma.weeklySchedule.findMany()
    
    if (existingSchedule.length > 0) {
      return NextResponse.json({ 
        message: "Schedule already exists",
        schedule: existingSchedule
      })
    }

    // Create the weekly schedule
    const createdSchedules = []
    
    for (const day of defaultSchedule) {
      const schedule = await prisma.weeklySchedule.create({
        data: {
          dayOfWeek: day.dayOfWeek,
          name: day.name
        },
        include: {
          exercises: {
            include: {
              exercise: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      })
      createdSchedules.push(schedule)
    }

    return NextResponse.json({
      message: "Weekly schedule initialized successfully",
      schedule: createdSchedules
    })

  } catch (error) {
    console.error("Error initializing schedule:", error)
    return NextResponse.json(
      { error: "Failed to initialize schedule" },
      { status: 500 }
    )
  }
}
