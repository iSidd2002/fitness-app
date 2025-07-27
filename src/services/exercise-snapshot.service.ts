import { prisma } from "@/lib/prisma"

// Exercise snapshot structure
export interface ExerciseSnapshot {
  id: string
  name: string
  description?: string
  muscleGroup: string
  equipment: string
  videoUrl?: string
  userId?: string
  capturedAt: string // ISO timestamp
  version: number    // For schema migrations
}

// Exercise interface for type safety
export interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroup: string
  equipment: string
  videoUrl?: string
  userId?: string
  createdAt?: Date
  updatedAt?: Date
  isDeleted?: boolean
}

export class ExerciseSnapshotService {
  
  /**
   * Create a snapshot of an exercise at the current moment
   */
  static createSnapshot(exercise: Exercise): ExerciseSnapshot {
    return {
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      videoUrl: exercise.videoUrl,
      userId: exercise.userId,
      capturedAt: new Date().toISOString(),
      version: 1
    }
  }

  /**
   * Save a workout exercise with snapshot data
   */
  static async saveWorkoutExercise(
    workoutLogId: string,
    exercise: Exercise,
    order: number,
    isReplaced: boolean = false,
    originalExerciseId?: string
  ) {
    const snapshot = this.createSnapshot(exercise)
    
    return await prisma.workoutExercise.create({
      data: {
        workoutLogId,
        originalExerciseId: isReplaced ? originalExerciseId : exercise.id,
        replacementExerciseId: isReplaced ? exercise.id : null,
        exerciseSnapshot: snapshot,
        isCustom: !!exercise.userId,
        isReplaced,
        replacedAt: isReplaced ? new Date() : null,
        order
      }
    })
  }

  /**
   * Get exercise data from a workout exercise snapshot
   */
  static getExerciseFromSnapshot(workoutExercise: any): Exercise {
    const snapshot = workoutExercise.exerciseSnapshot as ExerciseSnapshot
    return {
      id: snapshot.id,
      name: snapshot.name,
      description: snapshot.description,
      muscleGroup: snapshot.muscleGroup,
      equipment: snapshot.equipment,
      videoUrl: snapshot.videoUrl,
      userId: snapshot.userId,
      createdAt: new Date(snapshot.capturedAt),
      updatedAt: new Date(snapshot.capturedAt)
    }
  }

  /**
   * Get workout history with snapshot data (preserves historical accuracy)
   */
  static async getWorkoutHistory(userId: string) {
    const workoutLogs = await prisma.workoutLog.findMany({
      where: { userId },
      include: {
        workoutExercises: {
          include: {
            sets: {
              orderBy: {
                setNumber: 'asc'
              }
            }
            // Note: We DON'T include exercise relation
            // We use exerciseSnapshot instead for historical accuracy
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc' // Most recent first
      }
    })

    return workoutLogs.map(log => ({
      ...log,
      workoutExercises: log.workoutExercises.map(we => ({
        ...we,
        exercise: this.getExerciseFromSnapshot(we)
      }))
    }))
  }

  /**
   * Get today's schedule with current exercise data (not snapshots)
   */
  static async getTodaysSchedule(dayOfWeek: number) {
    const schedule = await prisma.weeklySchedule.findUnique({
      where: { dayOfWeek },
      include: {
        exercises: {
          include: {
            exercise: {
              where: {
                isDeleted: false // Only include non-deleted exercises
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    // Filter out exercises that have been deleted
    if (schedule) {
      schedule.exercises = schedule.exercises.filter(ex => ex.exercise && !ex.exercise.isDeleted)
    }

    return schedule
  }

  /**
   * Check if an exercise has been used in any workouts
   */
  static async isExerciseUsedInWorkouts(exerciseId: string): Promise<boolean> {
    const count = await prisma.workoutExercise.count({
      where: {
        OR: [
          { originalExerciseId: exerciseId },
          { replacementExerciseId: exerciseId }
        ]
      }
    })

    return count > 0
  }

  /**
   * Get exercise usage statistics
   */
  static async getExerciseUsageStats(exerciseId: string) {
    const [originalUsage, replacementUsage, totalWorkouts] = await Promise.all([
      prisma.workoutExercise.count({
        where: { originalExerciseId: exerciseId }
      }),
      prisma.workoutExercise.count({
        where: { replacementExerciseId: exerciseId }
      }),
      prisma.workoutExercise.count({
        where: {
          OR: [
            { originalExerciseId: exerciseId },
            { replacementExerciseId: exerciseId }
          ]
        }
      })
    ])

    return {
      usedAsOriginal: originalUsage,
      usedAsReplacement: replacementUsage,
      totalUsage: totalWorkouts,
      isUsed: totalWorkouts > 0
    }
  }

  /**
   * Validate snapshot data integrity
   */
  static validateSnapshot(snapshot: any): snapshot is ExerciseSnapshot {
    return (
      typeof snapshot === 'object' &&
      typeof snapshot.id === 'string' &&
      typeof snapshot.name === 'string' &&
      typeof snapshot.muscleGroup === 'string' &&
      typeof snapshot.equipment === 'string' &&
      typeof snapshot.capturedAt === 'string' &&
      typeof snapshot.version === 'number'
    )
  }

  /**
   * Migrate old workout exercises to use snapshots
   */
  static async migrateWorkoutExerciseToSnapshot(workoutExerciseId: string) {
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
      include: {
        originalExercise: true,
        replacementExercise: true
      }
    })

    if (!workoutExercise) {
      throw new Error('WorkoutExercise not found')
    }

    // Determine which exercise to snapshot
    const exerciseToSnapshot = workoutExercise.isReplaced 
      ? workoutExercise.replacementExercise 
      : workoutExercise.originalExercise

    if (!exerciseToSnapshot) {
      throw new Error('No exercise found to create snapshot from')
    }

    const snapshot = this.createSnapshot(exerciseToSnapshot)

    return await prisma.workoutExercise.update({
      where: { id: workoutExerciseId },
      data: {
        exerciseSnapshot: snapshot
      }
    })
  }
}
