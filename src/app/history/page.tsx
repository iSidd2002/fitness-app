"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Calendar, Dumbbell, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTotalSets = (workoutLog: WorkoutLog) => {
    return workoutLog.workoutExercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  }

  const getTotalVolume = (workoutLog: WorkoutLog) => {
    return workoutLog.workoutExercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exerciseTotal, set) => {
        return exerciseTotal + (set.reps * set.weightKg)
      }, 0)
    }, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading workout history...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Workout History</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {workoutLogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workout history yet</h3>
              <p className="text-gray-600 mb-4">
                Complete your first workout to see it here!
              </p>
              <Button asChild>
                <Link href="/">Start Today's Workout</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {workoutLogs.map((workoutLog) => (
              <Card key={workoutLog.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {formatDate(workoutLog.date)}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {daysOfWeek[workoutLog.dayOfWeek]} • {workoutLog.workoutExercises.length} exercises • {getTotalSets(workoutLog)} sets
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Total Volume
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {getTotalVolume(workoutLog).toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workoutLog.workoutExercises
                      .sort((a, b) => a.order - b.order)
                      .map((workoutExercise) => (
                        <div key={workoutExercise.id} className="border-l-4 border-blue-200 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium flex items-center space-x-2">
                                <span>{workoutExercise.exercise.name}</span>
                                {workoutExercise.isCustom && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    Custom
                                  </span>
                                )}
                                {workoutExercise.originalExerciseId && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                    Replaced
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600">
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
                          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-700 mb-2">
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
    <AuthGuard>
      <HistoryPageContent />
    </AuthGuard>
  )
}
