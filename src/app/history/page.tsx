"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { Calendar, Dumbbell, Edit3 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

import { EditWorkoutDialog } from "@/components/history/edit-workout-dialog"
import { AuthGuard } from "@/components/auth-guard"

interface ExerciseSet {
  id: string
  setNumber: number
  reps: number
  weightKg: number
}

interface WorkoutExercise {
  id: string
  exerciseId: string
  isCustom: boolean
  order: number
  originalExerciseId?: string
  originalExerciseName?: string
  exercise: {
    id: string
    name: string
    muscleGroup: string
    equipment: string
  }
  sets: ExerciseSet[]
}

interface WorkoutLog {
  id: string
  date: string
  dayOfWeek: number
  workoutExercises: WorkoutExercise[]
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function HistoryPageContent() {
  const { data: session } = useSession()
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchWorkoutHistory()
    }
  }, [session])

  const fetchWorkoutHistory = async () => {
    try {
      const response = await fetch("/api/workout/history")
      if (response.ok) {
        const data = await response.json()
        setWorkoutLogs(data.workoutLogs)
      }
    } catch (error) {
      console.error("Failed to fetch workout history:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const getTotalSets = (workoutLog: WorkoutLog) => {
    return workoutLog.workoutExercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  }

  const getTotalVolume = (workoutLog: WorkoutLog) => {
    return workoutLog.workoutExercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exerciseTotal, set) => {
        // Ensure we have valid numbers and handle edge cases
        const reps = Number(set.reps) || 0
        const weight = Number(set.weightKg) || 0
        return exerciseTotal + (reps * weight)
      }, 0)
    }, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading workout history...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6" style={{ color: "var(--primary)" }} />
          <h1 className="text-2xl font-bold">Workout History</h1>
        </div>
        {workoutLogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium font-semibold mb-2">No workout history yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete your first workout to see it here!
              </p>
              <Button asChild>
                <Link href="/">Start Today&apos;s Workout</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {workoutLogs.map((workoutLog) => (
              <Card key={workoutLog.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">
                        {formatDate(workoutLog.date)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {daysOfWeek[workoutLog.dayOfWeek]} • {workoutLog.workoutExercises.length} exercises • {getTotalSets(workoutLog)} sets
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium font-semibold">Total Volume</p>
                        <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                          {getTotalVolume(workoutLog).toFixed(1)} kg
                        </p>
                      </div>
                      <EditWorkoutDialog
                        workout={workoutLog}
                        onWorkoutUpdated={fetchWorkoutHistory}
                      >
                        <Button variant="outline" size="sm" className="mobile-button touch-manipulation">
                          <Edit3 className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">Edit</span>
                        </Button>
                      </EditWorkoutDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workoutLog.workoutExercises
                      .sort((a, b) => a.order - b.order)
                      .map((workoutExercise) => (
                        <div key={workoutExercise.id} className="border-l-4 pl-4" style={{ borderColor: "var(--primary)" }}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium flex flex-wrap items-center gap-2">
                                <span className="break-words">{workoutExercise.exercise.name}</span>
                                {workoutExercise.isCustom && (
                                  <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "oklch(0.62 0.19 244 / 20%)", color: "var(--primary)" }}>
                                    Custom
                                  </span>
                                )}
                                {workoutExercise.originalExerciseId && (
                                  <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap text-orange-400" style={{ backgroundColor: "oklch(0.7 0.18 50 / 20%)" }}>
                                    Replaced
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {workoutExercise.exercise.muscleGroup} • {workoutExercise.exercise.equipment}
                                {workoutExercise.originalExerciseName && (
                                  <span className="block text-xs text-orange-600 mt-1">
                                    Originally: {workoutExercise.originalExerciseName}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {/* Sets */}
                          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground mb-2">
                            <div>Set</div>
                            <div>Reps</div>
                            <div>Weight (kg)</div>
                          </div>
                          
                          <div className="space-y-1">
                            {workoutExercise.sets
                              .sort((a, b) => a.setNumber - b.setNumber)
                              .map((set) => (
                                <div key={set.id} className="grid grid-cols-3 gap-2 text-sm">
                                  <div className="font-medium">{set.setNumber}</div>
                                  <div>{set.reps}</div>
                                  <div>{set.weightKg}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuard>
        <HistoryPageContent />
      </AuthGuard>
    </Suspense>
  )
}
