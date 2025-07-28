import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/workout/streak - Get user's current workout streak and heatmap data
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all workout logs for the user, ordered by date
    const workoutLogs = await prisma.workoutLog.findMany({
      where: { 
        userId: session.user.id,
        // Only include workouts with actual exercises completed
        workoutExercises: {
          some: {
            sets: {
              some: {
                reps: { gt: 0 },
                weightKg: { gt: 0 }
              }
            }
          }
        }
      },
      select: {
        date: true,
        dayOfWeek: true,
        workoutExercises: {
          select: {
            sets: {
              select: {
                reps: true,
                weightKg: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate current streak
    const currentStreak = calculateCurrentStreak(workoutLogs)
    
    // Calculate longest streak
    const longestStreak = calculateLongestStreak(workoutLogs)
    
    // Generate heatmap data for the past 365 days
    const heatmapData = generateHeatmapData(workoutLogs)
    
    // Calculate total workouts
    const totalWorkouts = workoutLogs.length
    
    // Calculate this week's workouts
    const thisWeekWorkouts = calculateThisWeekWorkouts(workoutLogs)

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalWorkouts,
      thisWeekWorkouts,
      heatmapData
    })
  } catch (error) {
    console.error("Error fetching workout streak:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout streak" },
      { status: 500 }
    )
  }
}

interface WorkoutLogData {
  date: Date
  dayOfWeek: number
  workoutExercises: {
    sets: {
      reps: number
      weightKg: number
    }[]
  }[]
}

function calculateCurrentStreak(workoutLogs: WorkoutLogData[]): number {
  if (workoutLogs.length === 0) return 0

  // Group workouts by date (ignore time)
  const workoutDates = new Set(
    workoutLogs.map(log => new Date(log.date).toDateString())
  )

  let streak = 0
  const today = new Date()
  
  // Check if user worked out today or yesterday (to account for different time zones)
  const todayStr = today.toDateString()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  
  let currentDate = new Date()
  
  // If no workout today, start from yesterday
  if (!workoutDates.has(todayStr)) {
    if (!workoutDates.has(yesterdayStr)) {
      return 0 // No recent workout
    }
    currentDate = yesterday
  }

  // Count consecutive days with workouts
  while (workoutDates.has(currentDate.toDateString())) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

function calculateLongestStreak(workoutLogs: WorkoutLogData[]): number {
  if (workoutLogs.length === 0) return 0

  // Group workouts by date
  const workoutDates = Array.from(new Set(
    workoutLogs.map(log => new Date(log.date).toDateString())
  )).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  let longestStreak = 0
  let currentStreak = 1

  for (let i = 1; i < workoutDates.length; i++) {
    const prevDate = new Date(workoutDates[i - 1])
    const currentDate = new Date(workoutDates[i])
    
    // Check if dates are consecutive
    const diffTime = currentDate.getTime() - prevDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      currentStreak++
    } else {
      longestStreak = Math.max(longestStreak, currentStreak)
      currentStreak = 1
    }
  }
  
  return Math.max(longestStreak, currentStreak)
}

function calculateThisWeekWorkouts(workoutLogs: WorkoutLogData[]): number {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0)

  return workoutLogs.filter(log => {
    const logDate = new Date(log.date)
    return logDate >= startOfWeek
  }).length
}

function generateHeatmapData(workoutLogs: WorkoutLogData[]) {
  const heatmapData = []
  const today = new Date()
  
  // Group workouts by date and calculate intensity
  const workoutsByDate = new Map()
  
  workoutLogs.forEach(log => {
    const dateStr = new Date(log.date).toISOString().split('T')[0]
    
    // Calculate workout intensity based on total sets completed
    const totalSets = log.workoutExercises.reduce((total: number, exercise) => {
      return total + exercise.sets.filter((set) => set.reps > 0 && set.weightKg >= 0).length
    }, 0)
    
    if (!workoutsByDate.has(dateStr)) {
      workoutsByDate.set(dateStr, { count: 0, totalSets: 0 })
    }
    
    const existing = workoutsByDate.get(dateStr)
    existing.count += 1
    existing.totalSets += totalSets
  })

  // Generate data for past 365 days
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const workoutData = workoutsByDate.get(dateStr)
    
    let intensity = 0
    if (workoutData) {
      // Calculate intensity based on sets completed (0-4 scale)
      if (workoutData.totalSets >= 20) intensity = 4
      else if (workoutData.totalSets >= 15) intensity = 3
      else if (workoutData.totalSets >= 10) intensity = 2
      else if (workoutData.totalSets > 0) intensity = 1
    }
    
    heatmapData.push({
      date: dateStr,
      count: workoutData?.count || 0,
      intensity,
      totalSets: workoutData?.totalSets || 0
    })
  }

  return heatmapData
}
