import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Calculate estimated 1RM using Epley formula
function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

// GET /api/leaderboard/exercise-weights - Get exercise weight leaderboards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const exerciseName = searchParams.get('exercise')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (exerciseName) {
      // Get leaderboard for specific exercise
      const exerciseLeaderboard = await getExerciseLeaderboard(exerciseName, limit)
      return NextResponse.json(exerciseLeaderboard)
    } else {
      // Get top exercises with leaderboards
      const topExercises = await getTopExercisesLeaderboard(limit)
      return NextResponse.json(topExercises)
    }

  } catch (error) {
    console.error("Error fetching exercise leaderboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    )
  }
}

async function getExerciseLeaderboard(exerciseName: string, limit: number) {
  // Get all workout exercises first, then filter by exercise name
  const workoutExercises = await prisma.workoutExercise.findMany({
    include: {
      sets: {
        orderBy: {
          weightKg: 'desc'
        }
      },
      workoutLog: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  })

  // Filter by exercise name from snapshot
  const filteredExercises = workoutExercises.filter(we => {
    const snapshot = we.exerciseSnapshot as { name?: string } | null
    return snapshot?.name === exerciseName
  })

  // Get all sets from filtered exercises
  const exerciseSets = filteredExercises.flatMap(we =>
    we.sets.map(set => ({
      ...set,
      workoutExercise: we
    }))
  ).sort((a, b) => b.weightKg - a.weightKg)

  // Process data to get max weights and 1RMs per user
  const userStats = new Map()

  exerciseSets.forEach(set => {
    const userId = set.workoutExercise.workoutLog.userId
    const user = set.workoutExercise.workoutLog.user
    const weight = set.weightKg
    const reps = set.reps
    const oneRepMax = calculateOneRepMax(weight, reps)

    if (!userStats.has(userId)) {
      userStats.set(userId, {
        userId,
        userName: user.name || user.email,
        maxWeight: weight,
        maxWeightReps: reps,
        estimatedOneRepMax: oneRepMax,
        bestOneRepMaxWeight: weight,
        bestOneRepMaxReps: reps,
        totalSets: 0
      })
    }

    const current = userStats.get(userId)
    current.totalSets++

    // Update max weight
    if (weight > current.maxWeight) {
      current.maxWeight = weight
      current.maxWeightReps = reps
    }

    // Update best estimated 1RM
    if (oneRepMax > current.estimatedOneRepMax) {
      current.estimatedOneRepMax = oneRepMax
      current.bestOneRepMaxWeight = weight
      current.bestOneRepMaxReps = reps
    }
  })

  // Convert to array and sort by estimated 1RM
  const leaderboard = Array.from(userStats.values())
    .sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax)
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
      estimatedOneRepMax: Math.round(entry.estimatedOneRepMax * 10) / 10 // Round to 1 decimal
    }))

  return {
    exerciseName,
    leaderboard,
    totalParticipants: userStats.size
  }
}

async function getTopExercisesLeaderboard(limit: number) {
  // Get all workout exercises with their sets
  const workoutExercises = await prisma.workoutExercise.findMany({
    include: {
      sets: true,
      workoutLog: {
        select: {
          userId: true
        }
      }
    }
  })

  // Group by exercise name
  const exerciseStats = new Map<string, {
    exerciseName: string
    participantCount: number
    totalSets: number
    maxWeightRecorded: number
    userIds: Set<string>
  }>()

  workoutExercises.forEach(we => {
    const snapshot = we.exerciseSnapshot as { name?: string } | null
    const exerciseName = snapshot?.name

    if (!exerciseName || we.sets.length === 0) return

    if (!exerciseStats.has(exerciseName)) {
      exerciseStats.set(exerciseName, {
        exerciseName,
        participantCount: 0,
        totalSets: 0,
        maxWeightRecorded: 0,
        userIds: new Set()
      })
    }

    const stats = exerciseStats.get(exerciseName)!
    stats.userIds.add(we.workoutLog.userId)
    stats.totalSets += we.sets.length

    const maxWeight = Math.max(...we.sets.map(s => s.weightKg))
    if (maxWeight > stats.maxWeightRecorded) {
      stats.maxWeightRecorded = maxWeight
    }
  })

  // Convert to array and calculate final participant counts
  const allExercises = Array.from(exerciseStats.values())
    .map(stats => ({
      exerciseName: stats.exerciseName,
      participantCount: stats.userIds.size,
      totalSets: stats.totalSets,
      maxWeightRecorded: stats.maxWeightRecorded
    }))

  const topExercises = allExercises
    .filter(exercise => exercise.participantCount >= 1) // Show exercises with at least 1 participant
    .sort((a, b) => b.totalSets - a.totalSets) // Sort by total sets
    .slice(0, limit)

  return {
    topExercises
  }
}
