import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const globalExercises = [
  // Chest
  { name: "Bench Press", description: "Classic chest exercise with barbell", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Incline Bench Press", description: "Upper chest focused bench press", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Dumbbell Bench Press", description: "Chest exercise with dumbbells", muscleGroup: "Chest", equipment: "Dumbbells" },
  { name: "Push-ups", description: "Bodyweight chest exercise", muscleGroup: "Chest", equipment: "Bodyweight" },
  { name: "Chest Dips", description: "Bodyweight chest and tricep exercise", muscleGroup: "Chest", equipment: "Bodyweight" },
  { name: "Chest Fly", description: "Isolation exercise for chest", muscleGroup: "Chest", equipment: "Dumbbells" },

  // Back
  { name: "Deadlift", description: "Full body compound movement", muscleGroup: "Back", equipment: "Barbell" },
  { name: "Pull-ups", description: "Bodyweight back exercise", muscleGroup: "Back", equipment: "Bodyweight" },
  { name: "Bent-over Row", description: "Back exercise with barbell", muscleGroup: "Back", equipment: "Barbell" },
  { name: "Lat Pulldown", description: "Cable back exercise", muscleGroup: "Back", equipment: "Cable Machine" },
  { name: "T-Bar Row", description: "Back exercise with T-bar", muscleGroup: "Back", equipment: "T-Bar" },
  { name: "Seated Cable Row", description: "Seated rowing exercise", muscleGroup: "Back", equipment: "Cable Machine" },

  // Legs
  { name: "Squat", description: "King of leg exercises", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Front Squat", description: "Quad-focused squat variation", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Leg Press", description: "Machine-based leg exercise", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Lunges", description: "Single-leg exercise", muscleGroup: "Legs", equipment: "Bodyweight" },
  { name: "Bulgarian Split Squat", description: "Single-leg squat variation", muscleGroup: "Legs", equipment: "Bodyweight" },
  { name: "Leg Curl", description: "Hamstring isolation exercise", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Leg Extension", description: "Quadriceps isolation exercise", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Calf Raises", description: "Calf muscle exercise", muscleGroup: "Legs", equipment: "Bodyweight" },

  // Shoulders
  { name: "Overhead Press", description: "Standing shoulder press", muscleGroup: "Shoulders", equipment: "Barbell" },
  { name: "Dumbbell Shoulder Press", description: "Seated shoulder press with dumbbells", muscleGroup: "Shoulders", equipment: "Dumbbells" },
  { name: "Lateral Raises", description: "Side deltoid isolation", muscleGroup: "Shoulders", equipment: "Dumbbells" },
  { name: "Front Raises", description: "Front deltoid isolation", muscleGroup: "Shoulders", equipment: "Dumbbells" },
  { name: "Rear Delt Fly", description: "Rear deltoid isolation", muscleGroup: "Shoulders", equipment: "Dumbbells" },
  { name: "Upright Row", description: "Shoulder and trap exercise", muscleGroup: "Shoulders", equipment: "Barbell" },

  // Arms
  { name: "Bicep Curls", description: "Basic bicep exercise", muscleGroup: "Arms", equipment: "Dumbbells" },
  { name: "Hammer Curls", description: "Neutral grip bicep exercise", muscleGroup: "Arms", equipment: "Dumbbells" },
  { name: "Tricep Dips", description: "Bodyweight tricep exercise", muscleGroup: "Arms", equipment: "Bodyweight" },
  { name: "Close-Grip Bench Press", description: "Tricep-focused bench press", muscleGroup: "Arms", equipment: "Barbell" },
  { name: "Tricep Pushdown", description: "Cable tricep exercise", muscleGroup: "Arms", equipment: "Cable Machine" },
  { name: "Preacher Curls", description: "Isolated bicep exercise", muscleGroup: "Arms", equipment: "Barbell" },

  // Core
  { name: "Plank", description: "Core stability exercise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Crunches", description: "Basic abdominal exercise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Russian Twists", description: "Oblique exercise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Mountain Climbers", description: "Dynamic core exercise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Dead Bug", description: "Core stability exercise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Hanging Leg Raises", description: "Advanced core exercise", muscleGroup: "Core", equipment: "Pull-up Bar" },

  // Cardio
  { name: "Burpees", description: "Full body cardio exercise", muscleGroup: "Cardio", equipment: "Bodyweight" },
  { name: "Jumping Jacks", description: "Basic cardio exercise", muscleGroup: "Cardio", equipment: "Bodyweight" },
  { name: "High Knees", description: "Cardio warm-up exercise", muscleGroup: "Cardio", equipment: "Bodyweight" },
  { name: "Treadmill Running", description: "Machine-based cardio", muscleGroup: "Cardio", equipment: "Treadmill" },
]

// Default Bro Split Schedule
const broSplitSchedule = [
  {
    dayOfWeek: 1, // Monday - Push Day
    name: "Push Day (Chest, Shoulders, Triceps)",
    exercises: ["Bench Press", "Incline Bench Press", "Overhead Press", "Dumbbell Shoulder Press", "Lateral Raises", "Tricep Dips", "Close-Grip Bench Press"]
  },
  {
    dayOfWeek: 2, // Tuesday - Pull Day
    name: "Pull Day (Back, Biceps)",
    exercises: ["Deadlift", "Pull-ups", "Bent-over Row", "Lat Pulldown", "Seated Cable Row", "Bicep Curls", "Hammer Curls"]
  },
  {
    dayOfWeek: 3, // Wednesday - Leg Day
    name: "Leg Day",
    exercises: ["Squat", "Front Squat", "Leg Press", "Lunges", "Bulgarian Split Squat", "Leg Curl", "Leg Extension", "Calf Raises"]
  },
  {
    dayOfWeek: 4, // Thursday - Push Day
    name: "Push Day (Chest, Shoulders, Triceps)",
    exercises: ["Dumbbell Bench Press", "Incline Bench Press", "Dumbbell Shoulder Press", "Front Raises", "Rear Delt Fly", "Tricep Pushdown", "Chest Dips"]
  },
  {
    dayOfWeek: 5, // Friday - Pull Day
    name: "Pull Day (Back, Biceps)",
    exercises: ["T-Bar Row", "Pull-ups", "Seated Cable Row", "Lat Pulldown", "Preacher Curls", "Hammer Curls", "Bicep Curls"]
  },
  {
    dayOfWeek: 6, // Saturday - Leg Day
    name: "Leg Day",
    exercises: ["Deadlift", "Squat", "Leg Press", "Lunges", "Leg Curl", "Leg Extension", "Calf Raises"]
  },
  {
    dayOfWeek: 0, // Sunday - Rest/Cardio
    name: "Active Recovery (Cardio & Core)",
    exercises: ["Treadmill Running", "Burpees", "Jumping Jacks", "Plank", "Crunches", "Russian Twists", "Mountain Climbers"]
  }
]

async function main() {
  console.log('🌱 Starting to seed the database...')

  // Check if exercises already exist
  const existingExercises = await prisma.exercise.count()

  if (existingExercises === 0) {
    // Create global exercises (userId is null for global exercises)
    console.log('📝 Creating global exercises...')
    for (const exercise of globalExercises) {
      await prisma.exercise.create({
        data: {
          ...exercise,
          // userId is null for global exercises - this makes them available to all users
        }
      })
    }
    console.log(`✅ Successfully seeded ${globalExercises.length} global exercises!`)
  } else {
    console.log(`📊 Database already has ${existingExercises} exercises.`)
  }

  // Check if schedule already exists
  const existingSchedule = await prisma.weeklySchedule.count()

  if (existingSchedule === 0) {
    console.log('📅 Creating default Bro Split schedule...')

    for (const day of broSplitSchedule) {
      // Create the weekly schedule entry
      const schedule = await prisma.weeklySchedule.create({
        data: {
          dayOfWeek: day.dayOfWeek,
          name: day.name
        }
      })

      // Add exercises to this day
      for (let i = 0; i < day.exercises.length; i++) {
        const exerciseName = day.exercises[i]
        const exercise = await prisma.exercise.findFirst({
          where: { name: exerciseName }
        })

        if (exercise) {
          await prisma.scheduleExercise.create({
            data: {
              scheduleId: schedule.id,
              exerciseId: exercise.id,
              order: i + 1
            }
          })
        }
      }
    }

    console.log(`✅ Successfully created Bro Split schedule for all 7 days!`)
  } else {
    console.log(`📅 Schedule already exists with ${existingSchedule} days.`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
