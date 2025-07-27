import { prisma } from "@/lib/prisma"
import { Exercise } from "./exercise-snapshot.service"

export class ExerciseUpdateService {
  
  /**
   * Update an exercise with full audit trail and change tracking
   */
  static async updateExercise(
    exerciseId: string, 
    updates: Partial<Exercise>,
    adminUserId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get the current exercise data for audit trail
      const currentExercise = await tx.exercise.findUnique({
        where: { id: exerciseId }
      })

      if (!currentExercise) {
        throw new Error('Exercise not found')
      }

      if (currentExercise.isDeleted) {
        throw new Error('Cannot update deleted exercise')
      }

      // 2. Update the exercise
      const updatedExercise = await tx.exercise.update({
        where: { id: exerciseId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      })

      // 3. Log the change for audit trail
      await tx.exerciseChangeLog.create({
        data: {
          exerciseId,
          changedBy: adminUserId,
          changeType: 'UPDATE',
          oldData: {
            id: currentExercise.id,
            name: currentExercise.name,
            description: currentExercise.description,
            muscleGroup: currentExercise.muscleGroup,
            equipment: currentExercise.equipment,
            videoUrl: currentExercise.videoUrl,
            userId: currentExercise.userId,
            updatedAt: currentExercise.updatedAt.toISOString()
          },
          newData: {
            id: updatedExercise.id,
            name: updatedExercise.name,
            description: updatedExercise.description,
            muscleGroup: updatedExercise.muscleGroup,
            equipment: updatedExercise.equipment,
            videoUrl: updatedExercise.videoUrl,
            userId: updatedExercise.userId,
            updatedAt: updatedExercise.updatedAt.toISOString()
          },
          changedAt: new Date()
        }
      })

      return updatedExercise
    })
  }

  /**
   * Soft delete an exercise (preserves data integrity)
   */
  static async softDeleteExercise(exerciseId: string, adminUserId: string) {
    return await prisma.$transaction(async (tx) => {
      // Check if exercise is used in any workouts
      const usageStats = await this.getExerciseUsageStats(exerciseId)

      const currentExercise = await tx.exercise.findUnique({
        where: { id: exerciseId }
      })

      if (!currentExercise) {
        throw new Error('Exercise not found')
      }

      if (currentExercise.isDeleted) {
        throw new Error('Exercise is already deleted')
      }

      if (usageStats.isUsed) {
        // Soft delete only - preserve data integrity
        const deletedExercise = await tx.exercise.update({
          where: { id: exerciseId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: adminUserId
          }
        })

        // Log the deletion
        await tx.exerciseChangeLog.create({
          data: {
            exerciseId,
            changedBy: adminUserId,
            changeType: 'DELETE',
            oldData: {
              id: currentExercise.id,
              name: currentExercise.name,
              description: currentExercise.description,
              muscleGroup: currentExercise.muscleGroup,
              equipment: currentExercise.equipment,
              videoUrl: currentExercise.videoUrl,
              userId: currentExercise.userId,
              isDeleted: false
            },
            newData: {
              id: deletedExercise.id,
              name: deletedExercise.name,
              description: deletedExercise.description,
              muscleGroup: deletedExercise.muscleGroup,
              equipment: deletedExercise.equipment,
              videoUrl: deletedExercise.videoUrl,
              userId: deletedExercise.userId,
              isDeleted: true,
              deletedAt: deletedExercise.deletedAt?.toISOString()
            },
            changedAt: new Date()
          }
        })

        return {
          exercise: deletedExercise,
          deletionType: 'soft',
          reason: `Exercise is used in ${usageStats.totalUsage} workout(s). Soft deleted to preserve data integrity.`
        }
      } else {
        // Hard delete if never used
        await tx.exercise.delete({
          where: { id: exerciseId }
        })

        // Log the deletion
        await tx.exerciseChangeLog.create({
          data: {
            exerciseId,
            changedBy: adminUserId,
            changeType: 'DELETE',
            oldData: {
              id: currentExercise.id,
              name: currentExercise.name,
              description: currentExercise.description,
              muscleGroup: currentExercise.muscleGroup,
              equipment: currentExercise.equipment,
              videoUrl: currentExercise.videoUrl,
              userId: currentExercise.userId,
              isDeleted: false
            },
            newData: null, // Exercise is completely removed
            changedAt: new Date()
          }
        })

        return {
          exercise: null,
          deletionType: 'hard',
          reason: 'Exercise was never used in workouts. Permanently deleted.'
        }
      }
    })
  }

  /**
   * Create a new exercise with audit trail
   */
  static async createExercise(
    exerciseData: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const newExercise = await tx.exercise.create({
        data: {
          ...exerciseData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Log the creation
      await tx.exerciseChangeLog.create({
        data: {
          exerciseId: newExercise.id,
          changedBy: createdBy,
          changeType: 'CREATE',
          oldData: null,
          newData: {
            id: newExercise.id,
            name: newExercise.name,
            description: newExercise.description,
            muscleGroup: newExercise.muscleGroup,
            equipment: newExercise.equipment,
            videoUrl: newExercise.videoUrl,
            userId: newExercise.userId,
            createdAt: newExercise.createdAt.toISOString()
          },
          changedAt: new Date()
        }
      })

      return newExercise
    })
  }

  /**
   * Get exercise usage statistics
   */
  static async getExerciseUsageStats(exerciseId: string) {
    const [originalUsage, replacementUsage] = await Promise.all([
      prisma.workoutExercise.count({
        where: { originalExerciseId: exerciseId }
      }),
      prisma.workoutExercise.count({
        where: { replacementExerciseId: exerciseId }
      })
    ])

    const totalUsage = originalUsage + replacementUsage

    return {
      usedAsOriginal: originalUsage,
      usedAsReplacement: replacementUsage,
      totalUsage,
      isUsed: totalUsage > 0
    }
  }

  /**
   * Get exercise change history
   */
  static async getExerciseChangeHistory(exerciseId: string) {
    return await prisma.exerciseChangeLog.findMany({
      where: { exerciseId },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        changedAt: 'desc'
      }
    })
  }

  /**
   * Restore a soft-deleted exercise
   */
  static async restoreExercise(exerciseId: string, adminUserId: string) {
    return await prisma.$transaction(async (tx) => {
      const exercise = await tx.exercise.findUnique({
        where: { id: exerciseId }
      })

      if (!exercise) {
        throw new Error('Exercise not found')
      }

      if (!exercise.isDeleted) {
        throw new Error('Exercise is not deleted')
      }

      const restoredExercise = await tx.exercise.update({
        where: { id: exerciseId },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedAt: new Date()
        }
      })

      // Log the restoration
      await tx.exerciseChangeLog.create({
        data: {
          exerciseId,
          changedBy: adminUserId,
          changeType: 'RESTORE',
          oldData: {
            id: exercise.id,
            name: exercise.name,
            isDeleted: true,
            deletedAt: exercise.deletedAt?.toISOString()
          },
          newData: {
            id: restoredExercise.id,
            name: restoredExercise.name,
            isDeleted: false,
            restoredAt: new Date().toISOString()
          },
          changedAt: new Date()
        }
      })

      return restoredExercise
    })
  }
}
