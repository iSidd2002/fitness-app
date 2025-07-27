import { prisma } from "@/lib/prisma"
import { ExerciseSnapshotService } from "./exercise-snapshot.service"

export class WorkoutDataMigration {
  
  /**
   * Migrate existing workout data to use the snapshot pattern
   */
  static async migrateToSnapshotPattern() {
    console.log('🚀 Starting workout data migration to snapshot pattern...')
    
    try {
      // Get all workout exercises and filter for those without snapshots
      // We need to use raw query to get the old exerciseId field
      const rawWorkoutExercises = await prisma.$runCommandRaw({
        find: 'WorkoutExercise',
        filter: {}
      }) as { cursor: { firstBatch: Array<{ _id: { $oid: string }; exerciseId: { $oid: string } | string; exerciseSnapshot?: unknown; isCustom?: boolean; order?: number }> } }

      const allWorkoutExercises = rawWorkoutExercises.cursor.firstBatch

      // Filter for exercises without snapshots
      const workoutExercises = allWorkoutExercises.filter(we =>
        !we.exerciseSnapshot ||
        (typeof we.exerciseSnapshot === 'object' && we.exerciseSnapshot !== null && Object.keys(we.exerciseSnapshot).length === 0)
      )

      console.log(`📊 Found ${workoutExercises.length} workout exercises to migrate`)

      if (workoutExercises.length === 0) {
        console.log('✅ No migration needed - all records already have snapshots')
        return { migrated: 0, skipped: 0, errors: 0 }
      }

      let migrated = 0
      let skipped = 0
      let errors = 0
      const batchSize = 100

      // Process in batches to avoid memory issues
      for (let i = 0; i < workoutExercises.length; i += batchSize) {
        const batch = workoutExercises.slice(i, i + batchSize)
        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(workoutExercises.length / batchSize)}`)
        
        await prisma.$transaction(async (tx) => {
          for (const we of batch) {
            try {
              // Get the exercise ID from the old exerciseId field
              const exerciseId = typeof we.exerciseId === 'object' && we.exerciseId?.$oid
                ? we.exerciseId.$oid
                : typeof we.exerciseId === 'string' ? we.exerciseId : null

              if (!exerciseId) {
                console.warn(`⚠️  Skipping workout exercise ${we._id.$oid} - no exerciseId found`)
                skipped++
                continue
              }

              // Fetch the exercise data
              const exercise = await tx.exercise.findUnique({
                where: { id: exerciseId }
              })

              if (!exercise) {
                console.warn(`⚠️  Skipping workout exercise ${we._id.$oid} - exercise ${exerciseId} not found`)
                skipped++
                continue
              }

              // Create snapshot
              const exerciseForSnapshot = {
                ...exercise,
                description: exercise.description || undefined,
                videoUrl: exercise.videoUrl || undefined,
                userId: exercise.userId || undefined
              }
              const snapshot = ExerciseSnapshotService.createSnapshot(exerciseForSnapshot)

              // Update the workout exercise with snapshot data
              await tx.workoutExercise.update({
                where: { id: we._id.$oid },
                data: {
                  exerciseSnapshot: JSON.parse(JSON.stringify(snapshot)),
                  originalExerciseId: exerciseId, // The original exercise
                  replacementExerciseId: null, // No replacement in old data
                  isReplaced: false, // Old data didn't have replacements
                  replacedAt: null,
                  isCustom: we.isCustom || false,
                  order: we.order || 1
                }
              })

              migrated++
            } catch (error) {
              console.error(`❌ Error migrating workout exercise ${we._id?.$oid || 'unknown'}:`, error)
              errors++
            }
          }
        })

        console.log(`✅ Batch complete. Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`)
      }

      console.log(`🎉 Migration complete!`)
      console.log(`📈 Results: ${migrated} migrated, ${skipped} skipped, ${errors} errors`)

      return { migrated, skipped, errors }
    } catch (error) {
      console.error('💥 Migration failed:', error)
      throw error
    }
  }

  /**
   * Validate migration results
   */
  static async validateMigration() {
    console.log('🔍 Validating migration results...')

    // Get all workout exercises and count manually to avoid Prisma JSON issues
    const allWorkoutExercises = await prisma.workoutExercise.findMany({
      select: {
        id: true,
        exerciseSnapshot: true
      }
    })

    const totalWorkoutExercises = allWorkoutExercises.length
    const withSnapshots = allWorkoutExercises.filter(we =>
      we.exerciseSnapshot &&
      typeof we.exerciseSnapshot === 'object' &&
      Object.keys(we.exerciseSnapshot).length > 0
    ).length
    const withoutSnapshots = totalWorkoutExercises - withSnapshots

    console.log(`📊 Validation Results:`)
    console.log(`   Total workout exercises: ${totalWorkoutExercises}`)
    console.log(`   With snapshots: ${withSnapshots}`)
    console.log(`   Without snapshots: ${withoutSnapshots}`)

    if (withoutSnapshots === 0) {
      console.log('✅ Migration validation passed - all records have snapshots')
    } else {
      console.log(`⚠️  Migration validation warning - ${withoutSnapshots} records still missing snapshots`)
    }

    return {
      total: totalWorkoutExercises,
      withSnapshots,
      withoutSnapshots,
      isComplete: withoutSnapshots === 0
    }
  }

  /**
   * Rollback migration (for testing purposes)
   */
  static async rollbackMigration() {
    console.log('🔄 Rolling back migration...')
    
    const result = await prisma.workoutExercise.updateMany({
      data: {
        exerciseSnapshot: null,
        // Keep other fields as they might be useful
      }
    })

    console.log(`🔄 Rollback complete - cleared ${result.count} snapshots`)
    return result
  }

  /**
   * Fix inconsistent data after migration
   */
  static async fixInconsistentData() {
    console.log('🔧 Fixing inconsistent data...')

    // Find workout exercises with snapshots but missing proper references
    const allRecords = await prisma.workoutExercise.findMany({
      select: {
        id: true,
        exerciseSnapshot: true,
        originalExerciseId: true,
        replacementExerciseId: true
      }
    })

    const inconsistentRecords = allRecords.filter(record =>
      record.exerciseSnapshot &&
      typeof record.exerciseSnapshot === 'object' &&
      Object.keys(record.exerciseSnapshot).length > 0 &&
      !record.originalExerciseId &&
      !record.replacementExerciseId
    )

    console.log(`🔧 Found ${inconsistentRecords.length} inconsistent records`)

    let fixed = 0
    for (const record of inconsistentRecords) {
      try {
        const snapshot = record.exerciseSnapshot as { id?: string }
        if (snapshot && snapshot.id) {
          await prisma.workoutExercise.update({
            where: { id: record.id },
            data: {
              originalExerciseId: snapshot.id,
              isReplaced: false
            }
          })
          fixed++
        }
      } catch (error) {
        console.error(`❌ Error fixing record ${record.id}:`, error)
      }
    }

    console.log(`🔧 Fixed ${fixed} inconsistent records`)
    return { found: inconsistentRecords.length, fixed }
  }

  /**
   * Generate migration report
   */
  static async generateMigrationReport() {
    console.log('📋 Generating migration report...')

    const [
      totalWorkouts,
      allWorkoutExercises,
      replacedExercises,
      customExercises,
      uniqueExercises
    ] = await Promise.all([
      prisma.workoutLog.count(),
      prisma.workoutExercise.findMany({
        select: {
          id: true,
          exerciseSnapshot: true,
          isReplaced: true,
          isCustom: true,
          originalExerciseId: true
        }
      }),
      prisma.workoutExercise.count({
        where: { isReplaced: true }
      }),
      prisma.workoutExercise.count({
        where: { isCustom: true }
      }),
      prisma.workoutExercise.groupBy({
        by: ['originalExerciseId'],
        where: { originalExerciseId: { not: null } }
      }).then(groups => groups.length)
    ])

    const totalWorkoutExercises = allWorkoutExercises.length
    const withSnapshots = allWorkoutExercises.filter(we =>
      we.exerciseSnapshot &&
      typeof we.exerciseSnapshot === 'object' &&
      Object.keys(we.exerciseSnapshot).length > 0
    ).length

    const report = {
      totalWorkouts,
      totalWorkoutExercises,
      withSnapshots,
      withoutSnapshots: totalWorkoutExercises - withSnapshots,
      replacedExercises,
      customExercises,
      uniqueExercises,
      migrationComplete: withSnapshots === totalWorkoutExercises,
      timestamp: new Date().toISOString()
    }

    console.log('📋 Migration Report:')
    console.log(JSON.stringify(report, null, 2))

    return report
  }

  /**
   * Run complete migration process with validation
   */
  static async runCompleteMigration() {
    console.log('🚀 Starting complete migration process...')

    try {
      // Step 1: Run migration
      const migrationResult = await this.migrateToSnapshotPattern()
      
      // Step 2: Fix any inconsistent data
      const fixResult = await this.fixInconsistentData()
      
      // Step 3: Validate results
      const validationResult = await this.validateMigration()
      
      // Step 4: Generate report
      const report = await this.generateMigrationReport()

      console.log('🎉 Complete migration process finished!')
      
      return {
        migration: migrationResult,
        fixes: fixResult,
        validation: validationResult,
        report
      }
    } catch (error) {
      console.error('💥 Complete migration process failed:', error)
      throw error
    }
  }
}
