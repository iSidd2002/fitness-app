#!/usr/bin/env tsx

/**
 * Migration script to convert existing workout data to use the snapshot pattern
 * 
 * This script:
 * 1. Migrates existing WorkoutExercise records to use exercise snapshots
 * 2. Preserves historical accuracy by capturing exercise data at workout time
 * 3. Maintains data integrity for exercise replacements
 * 4. Validates migration results
 * 
 * Usage:
 *   npx tsx scripts/migrate-workout-data.ts
 *   npx tsx scripts/migrate-workout-data.ts --validate-only
 *   npx tsx scripts/migrate-workout-data.ts --rollback
 */

import { WorkoutDataMigration } from '../src/services/workout-migration.service'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  console.log('🏋️‍♂️ IncelFitness Workout Data Migration Tool')
  console.log('=' .repeat(50))

  try {
    switch (command) {
      case '--validate-only':
        console.log('🔍 Running validation only...')
        const validationResult = await WorkoutDataMigration.validateMigration()
        
        if (validationResult.isComplete) {
          console.log('✅ All workout data has been migrated successfully!')
          process.exit(0)
        } else {
          console.log(`⚠️  Migration incomplete: ${validationResult.withoutSnapshots} records need migration`)
          process.exit(1)
        }
        break

      case '--rollback':
        console.log('🔄 Rolling back migration...')
        const rollbackResult = await WorkoutDataMigration.rollbackMigration()
        console.log(`✅ Rollback complete: ${rollbackResult.count} snapshots cleared`)
        break

      case '--report':
        console.log('📋 Generating migration report...')
        const report = await WorkoutDataMigration.generateMigrationReport()
        console.log('📋 Report generated successfully!')
        break

      case '--fix':
        console.log('🔧 Fixing inconsistent data...')
        const fixResult = await WorkoutDataMigration.fixInconsistentData()
        console.log(`✅ Fixed ${fixResult.fixed} inconsistent records`)
        break

      case '--help':
      case '-h':
        console.log('📖 Available commands:')
        console.log('  (no args)     - Run complete migration')
        console.log('  --validate-only - Only validate existing migration')
        console.log('  --rollback    - Rollback migration (for testing)')
        console.log('  --report      - Generate migration report')
        console.log('  --fix         - Fix inconsistent data')
        console.log('  --help, -h    - Show this help')
        break

      default:
        console.log('🚀 Running complete migration process...')
        const result = await WorkoutDataMigration.runCompleteMigration()
        
        console.log('\n📊 Final Results:')
        console.log(`   Migrated: ${result.migration.migrated} records`)
        console.log(`   Skipped: ${result.migration.skipped} records`)
        console.log(`   Errors: ${result.migration.errors} records`)
        console.log(`   Fixed: ${result.fixes.fixed} inconsistent records`)
        console.log(`   Migration Complete: ${result.validation.isComplete ? 'Yes' : 'No'}`)
        
        if (result.validation.isComplete) {
          console.log('\n🎉 Migration completed successfully!')
          console.log('✅ All workout data now uses the snapshot pattern for historical accuracy')
          console.log('✅ Exercise updates by admins will not affect historical workout data')
          console.log('✅ Exercise replacements are properly tracked')
        } else {
          console.log('\n⚠️  Migration completed with warnings')
          console.log(`   ${result.validation.withoutSnapshots} records still need attention`)
        }
        break
    }
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Migration interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Migration terminated')
  process.exit(0)
})

// Run the migration
main().catch((error) => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
