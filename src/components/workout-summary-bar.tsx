"use client"

import { useMemo } from "react"
import { Weight, CheckCircle2, Trophy } from "lucide-react"

interface ExerciseSet {
  reps: number
  weightKg: number
}

interface WorkoutExercise {
  exercise: { name: string }
  sets: ExerciseSet[]
}

interface WorkoutSummaryBarProps {
  workoutExercises: WorkoutExercise[]
  prExerciseNames?: Set<string>
}

export function WorkoutSummaryBar({ workoutExercises, prExerciseNames }: WorkoutSummaryBarProps) {
  const { totalVolume, completedSets, prCount } = useMemo(() => {
    let volume = 0
    let sets = 0
    for (const ex of workoutExercises) {
      for (const set of ex.sets) {
        if (set.reps > 0 && set.weightKg > 0) {
          volume += set.reps * set.weightKg
          sets++
        }
      }
    }
    return {
      totalVolume: volume,
      completedSets: sets,
      prCount: prExerciseNames?.size ?? 0,
    }
  }, [workoutExercises, prExerciseNames])

  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-center justify-around px-4 border-t"
      style={{
        bottom: "var(--nav-height)",
        height: "var(--summary-bar-height)",
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <Weight className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <span className="text-sm font-semibold">{totalVolume.toLocaleString()} kg</span>
      </div>

      <div className="w-px h-5" style={{ backgroundColor: "var(--border)" }} />

      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-semibold">{completedSets} sets</span>
      </div>

      {prCount > 0 && (
        <>
          <div className="w-px h-5" style={{ backgroundColor: "var(--border)" }} />
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">{prCount} PR</span>
          </div>
        </>
      )}
    </div>
  )
}
