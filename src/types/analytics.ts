// Analytics types for better type safety

export interface WorkoutLogWithExercises {
  id: string
  date: Date
  dayOfWeek: number
  userId: string
  workoutExercises: WorkoutExerciseWithSets[]
}

export interface WorkoutExerciseWithSets {
  id: string
  workoutLogId: string
  originalExerciseId?: string
  replacementExerciseId?: string
  exerciseSnapshot?: any
  isCustom: boolean
  isReplaced: boolean
  replacedAt?: Date
  order: number
  originalExercise?: {
    id: string
    name: string
    muscleGroup: string
    equipment: string
  } | null
  replacementExercise?: {
    id: string
    name: string
    muscleGroup: string
    equipment: string
  } | null
  sets: ExerciseSetData[]
}

export interface ExerciseSetData {
  id: string
  workoutExerciseId: string
  setNumber: number
  reps: number
  weightKg: number
  notes?: string
}

export interface WeightProgressPoint {
  date: string
  weight: number
  exerciseId: string
}

export interface VolumeTrendPoint {
  week: string
  volume: number
}

export interface MuscleGroupDistribution {
  name: string
  value: number
  percentage: number
}

export interface FrequencyTrendPoint {
  day: string
  count: number
}

export interface PersonalRecord {
  exerciseName: string
  weight: number
  reps: number
  oneRepMax: number
  date: string
  exerciseId: string
}

export interface AnalyticsSummary {
  totalWorkouts: number
  totalSets: number
  totalVolume: number
  uniqueExercises: number
  averageWorkoutsPerWeek: number
}
