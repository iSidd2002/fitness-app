import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfWeek, format, subDays } from "date-fns"
import type { WorkoutLogWithExercises, WeightProgressPoint, VolumeTrendPoint, MuscleGroupDistribution, FrequencyTrendPoint, PersonalRecord, AnalyticsSummary } from "@/types/analytics"

// Helper function to get exercise data from workout exercise (consistent with history page)
function getExerciseData(workoutExercise: any) {
  // Use snapshot data for historical accuracy (same as ExerciseSnapshotService)
  if (workoutExercise.exerciseSnapshot) {
    const snapshot = workoutExercise.exerciseSnapshot
    return {
      id: snapshot.id,
      name: snapshot.name,
      description: snapshot.description,
      muscleGroup: snapshot.muscleGroup,
      equipment: snapshot.equipment,
      videoUrl: snapshot.videoUrl,
      userId: snapshot.userId
    }
  }

  // Fallback to relations if no snapshot (shouldn't happen in normal operation)
  const exercise = workoutExercise.replacementExercise || workoutExercise.originalExercise
  return exercise ? {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    videoUrl: exercise.videoUrl,
    userId: exercise.userId
  } : null
}

// GET /api/analytics - Get comprehensive workout analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const exerciseId = searchParams.get('exerciseId')
    const muscleGroup = searchParams.get('muscleGroup')

    // Default to last 90 days if no date range specified
    const defaultEndDate = new Date()
    const defaultStartDate = subDays(defaultEndDate, 90)
    
    const dateFilter = {
      gte: startDate ? new Date(startDate) : defaultStartDate,
      lte: endDate ? new Date(endDate) : defaultEndDate
    }

    // Get workout logs with exercises and sets (using same method as history page for consistency)
    const rawWorkoutLogs = await prisma.workoutLog.findMany({
      where: {
        userId: session.user.id,
        date: dateFilter
      },
      include: {
        workoutExercises: {
          include: {
            sets: {
              where: {
                reps: { gt: 0 },
                weightKg: { gte: 0 } // Include bodyweight exercises (weightKg = 0)
              },
              orderBy: { setNumber: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Transform data to match history page structure using snapshots for consistency
    const workoutLogs = rawWorkoutLogs.map(log => ({
      ...log,
      workoutExercises: log.workoutExercises.map(we => ({
        ...we,
        exercise: getExerciseData(we)
      }))
    }))

    // Filter by exercise ID if specified
    const exerciseFilteredLogs = exerciseId
      ? workoutLogs.map(log => ({
          ...log,
          workoutExercises: log.workoutExercises.filter(we => {
            const exercise = we.exercise
            return exercise && exercise.id === exerciseId
          })
        })).filter(log => log.workoutExercises.length > 0)
      : workoutLogs

    // Filter by muscle group if specified
    const filteredLogs = muscleGroup
      ? exerciseFilteredLogs.map(log => ({
          ...log,
          workoutExercises: log.workoutExercises.filter(we => {
            const exercise = we.exercise
            return exercise && exercise.muscleGroup === muscleGroup
          })
        })).filter(log => log.workoutExercises.length > 0)
      : exerciseFilteredLogs

    // Calculate analytics data
    const analytics = {
      weightProgress: calculateWeightProgress(filteredLogs),
      volumeTrends: calculateVolumeTrends(filteredLogs),
      muscleGroupDistribution: calculateMuscleGroupDistribution(filteredLogs),
      frequencyTrends: calculateFrequencyTrends(filteredLogs),
      personalRecords: calculatePersonalRecords(filteredLogs),
      summary: calculateSummaryStats(filteredLogs)
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

function calculateWeightProgress(workoutLogs: any[]): { [key: string]: WeightProgressPoint[] } {
  const exerciseProgress: { [key: string]: WeightProgressPoint[] } = {}

  workoutLogs.forEach((log: any) => {
    log.workoutExercises.forEach((we: any) => {
      const exercise = getExerciseData(we)
      if (!exercise) return

      const exerciseName = exercise.name
      if (!exerciseProgress[exerciseName]) {
        exerciseProgress[exerciseName] = []
      }

      // Get max weight for this exercise in this workout
      const maxWeight = Math.max(...we.sets.map((set: any) => Number(set.weightKg) || 0))
      if (maxWeight > 0) {
        exerciseProgress[exerciseName].push({
          date: format(new Date(log.date), 'yyyy-MM-dd'),
          weight: maxWeight,
          exerciseId: exercise.id
        })
      }
    })
  })

  return exerciseProgress
}

function calculateVolumeTrends(workoutLogs: any[]): VolumeTrendPoint[] {
  const weeklyVolume: { [key: string]: number } = {}

  workoutLogs.forEach((log: any) => {
    const weekStart = format(startOfWeek(new Date(log.date)), 'yyyy-MM-dd')

    if (!weeklyVolume[weekStart]) {
      weeklyVolume[weekStart] = 0
    }

    log.workoutExercises.forEach((we: any) => {
      we.sets.forEach((set: any) => {
        // Ensure we have valid numbers and handle edge cases
        const reps = Number(set.reps) || 0
        const weight = Number(set.weightKg) || 0
        weeklyVolume[weekStart] += reps * weight
      })
    })
  })

  return Object.entries(weeklyVolume).map(([week, volume]) => ({
    week,
    volume: Math.round(volume)
  })).sort((a, b) => a.week.localeCompare(b.week))
}

function calculateMuscleGroupDistribution(workoutLogs: any[]): MuscleGroupDistribution[] {
  const muscleGroupCounts: { [key: string]: number } = {}

  workoutLogs.forEach((log: any) => {
    log.workoutExercises.forEach((we: any) => {
      const exercise = getExerciseData(we)
      if (!exercise) return

      const muscleGroup = exercise.muscleGroup
      muscleGroupCounts[muscleGroup] = (muscleGroupCounts[muscleGroup] || 0) + we.sets.length
    })
  })

  return Object.entries(muscleGroupCounts).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / Object.values(muscleGroupCounts).reduce((a, b) => a + b, 0)) * 100)
  }))
}

function calculateFrequencyTrends(workoutLogs: any[]): FrequencyTrendPoint[] {
  const dayFrequency: { [key: string]: number } = {
    'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
    'Thursday': 0, 'Friday': 0, 'Saturday': 0
  }

  workoutLogs.forEach((log: any) => {
    const dayName = format(new Date(log.date), 'EEEE')
    dayFrequency[dayName]++
  })

  return Object.entries(dayFrequency).map(([day, count]) => ({
    day,
    count
  }))
}

function calculatePersonalRecords(workoutLogs: any[]): PersonalRecord[] {
  const records: { [key: string]: PersonalRecord } = {}

  workoutLogs.forEach((log: any) => {
    log.workoutExercises.forEach((we: any) => {
      const exercise = getExerciseData(we)
      if (!exercise) return

      const exerciseName = exercise.name

      we.sets.forEach((set: any) => {
        const reps = Number(set.reps) || 0
        const weight = Number(set.weightKg) || 0
        const oneRepMax = calculateOneRepMax(weight, reps)

        if (!records[exerciseName] || oneRepMax > records[exerciseName].oneRepMax) {
          records[exerciseName] = {
            exerciseName,
            weight: weight,
            reps: reps,
            oneRepMax: Math.round(oneRepMax),
            date: format(new Date(log.date), 'yyyy-MM-dd'),
            exerciseId: exercise.id
          }
        }
      })
    })
  })

  return Object.values(records).sort((a, b) => b.oneRepMax - a.oneRepMax)
}

function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight
  // Brzycki formula: 1RM = weight / (1.0278 - 0.0278 × reps)
  return weight / (1.0278 - 0.0278 * reps)
}

function calculateSummaryStats(workoutLogs: any[]): AnalyticsSummary {
  const totalWorkouts = workoutLogs.length
  const totalSets = workoutLogs.reduce((total, log: any) =>
    total + log.workoutExercises.reduce((logTotal: number, we: any) =>
      logTotal + we.sets.length, 0), 0)

  const totalVolume = workoutLogs.reduce((total, log: any) =>
    total + log.workoutExercises.reduce((logTotal: number, we: any) =>
      logTotal + we.sets.reduce((setTotal: number, set: any) => {
        const reps = Number(set.reps) || 0
        const weight = Number(set.weightKg) || 0
        return setTotal + (reps * weight)
      }, 0), 0), 0)

  const uniqueExercises = new Set()
  workoutLogs.forEach((log: any) => {
    log.workoutExercises.forEach((we: any) => {
      const exercise = getExerciseData(we)
      if (exercise) {
        uniqueExercises.add(exercise.name)
      }
    })
  })

  return {
    totalWorkouts,
    totalSets,
    totalVolume: Math.round(totalVolume),
    uniqueExercises: uniqueExercises.size,
    averageWorkoutsPerWeek: totalWorkouts > 0 ? 
      Math.round((totalWorkouts / (workoutLogs.length > 0 ? 
        Math.ceil((new Date(workoutLogs[workoutLogs.length - 1].date).getTime() - 
                  new Date(workoutLogs[0].date).getTime()) / (7 * 24 * 60 * 60 * 1000)) : 1)) * 10) / 10 : 0
  }
}
