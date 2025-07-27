"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { Calendar, Plus, Dumbbell, LogOut, Save, Trash2, History, Settings, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddCustomExerciseDialog } from "@/components/add-custom-exercise-dialog"
import { ExerciseReplacementDialog } from "@/components/exercise-replacement-dialog"
import { useAuthGuard } from "@/components/auth-guard"

interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroup: string
  equipment: string
  videoUrl?: string
  userId?: string
}

interface ExerciseSet {
  id?: string
  setNumber: number
  reps: number
  weightKg: number
}

interface WorkoutExercise {
  id?: string
  exerciseId: string
  exercise: {
    id: string
    name: string
    muscleGroup: string
    equipment: string
  }
  isCustom: boolean
  order: number
  sets: ExerciseSet[]
  originalExerciseId?: string // Track if this exercise was replaced
  originalExerciseName?: string // Track original exercise name for display
}

interface TodaysSchedule {
  dayOfWeek: number
  name: string
  exercises: {
    id: string
    exerciseId: string
    exercise: {
      id: string
      name: string
      muscleGroup: string
      equipment: string
    }
    order: number
  }[]
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function DailyWorkoutDashboard() {
  const { session, isAuthenticated, isLoading } = useAuthGuard()
  const [todaysSchedule, setTodaysSchedule] = useState<TodaysSchedule | null>(null)
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isReplacementDialogOpen, setIsReplacementDialogOpen] = useState(false)
  const [exerciseToReplace, setExerciseToReplace] = useState<{ index: number; exercise: Exercise } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const dayOfWeek = today.getDay()
  const todayName = daysOfWeek[dayOfWeek]

  useEffect(() => {
    fetchTodaysSchedule()
  }, [])

  // Early return if not authenticated
  if (isLoading || !isAuthenticated) {
    return null // AuthGuard will handle the display
  }

  const fetchTodaysSchedule = async () => {
    try {
      const response = await fetch(`/api/schedule/today`)
      if (response.ok) {
        const data = await response.json()
        setTodaysSchedule(data.schedule)
        
        // Initialize workout exercises with admin-assigned exercises
        if (data.schedule?.exercises) {
          const initialExercises: WorkoutExercise[] = data.schedule.exercises.map((ex: { exerciseId: string; exercise: Exercise; order: number }) => ({
            exerciseId: ex.exerciseId,
            exercise: ex.exercise,
            isCustom: false,
            order: ex.order,
            sets: [{ setNumber: 1, reps: 0, weightKg: 0 }]
          }))
          setWorkoutExercises(initialExercises)
        }
      }
    } catch {
      toast.error("Failed to load today&apos;s schedule")
    } finally {
      setLoading(false)
    }
  }

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...workoutExercises]
    const exercise = newExercises[exerciseIndex]
    const newSetNumber = exercise.sets.length + 1
    
    exercise.sets.push({
      setNumber: newSetNumber,
      reps: 0,
      weightKg: 0
    })
    
    setWorkoutExercises(newExercises)
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weightKg', value: number) => {
    const newExercises = [...workoutExercises]
    newExercises[exerciseIndex].sets[setIndex][field] = value
    setWorkoutExercises(newExercises)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...workoutExercises]
    const exercise = newExercises[exerciseIndex]
    
    if (exercise.sets.length > 1) {
      exercise.sets.splice(setIndex, 1)
      // Renumber sets
      exercise.sets.forEach((set, index) => {
        set.setNumber = index + 1
      })
      setWorkoutExercises(newExercises)
    }
  }

  const addCustomExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exercise: exercise,
      isCustom: true,
      order: workoutExercises.length + 1,
      sets: [{ setNumber: 1, reps: 0, weightKg: 0 }]
    }

    setWorkoutExercises([...workoutExercises, newExercise])
    toast.success("Exercise added to today&apos;s workout!")
  }

  const handleReplaceExercise = (exerciseIndex: number) => {
    const exerciseToReplace = workoutExercises[exerciseIndex]
    setExerciseToReplace({ index: exerciseIndex, exercise: exerciseToReplace.exercise })
    setIsReplacementDialogOpen(true)
  }

  const handleExerciseReplaced = (newExercise: Exercise) => {
    if (exerciseToReplace) {
      const newExercises = [...workoutExercises]
      const oldExercise = newExercises[exerciseToReplace.index]

      // Keep the same sets but update the exercise and track the replacement
      newExercises[exerciseToReplace.index] = {
        ...oldExercise,
        exerciseId: newExercise.id,
        exercise: newExercise,
        // Track the original exercise if this is the first replacement
        originalExerciseId: oldExercise.originalExerciseId || oldExercise.exerciseId,
        originalExerciseName: oldExercise.originalExerciseName || oldExercise.exercise.name,
      }

      setWorkoutExercises(newExercises)
      setExerciseToReplace(null)
    }
  }

  const removeCustomExercise = (exerciseIndex: number) => {
    const newExercises = workoutExercises.filter((_, index) => index !== exerciseIndex)
    setWorkoutExercises(newExercises)
    toast.success("Exercise removed from workout")
  }

  const saveWorkout = async () => {
    setSaving(true)
    
    try {
      // Filter out exercises with no completed sets
      const completedExercises = workoutExercises.filter(ex => 
        ex.sets.some(set => set.reps > 0 && set.weightKg > 0)
      )

      if (completedExercises.length === 0) {
        toast.error("Please complete at least one set before saving")
        setSaving(false)
        return
      }

      const response = await fetch("/api/workout/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          exercises: completedExercises
        })
      })

      if (response.ok) {
        toast.success("Workout saved successfully! 🎉")
        // Reset the workout
        fetchTodaysSchedule()
      } else {
        toast.error("Failed to save workout")
      }
    } catch {
      toast.error("Failed to save workout")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading today&apos;s workout...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-friendly header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">IncelFitness</h1>
                <p className="text-xs text-gray-500">{todayName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/history">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">History</span>
                </Link>
              </Button>

              {session?.user?.role === "ADMIN" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/schedule">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Admin</span>
                  </Link>
                </Button>
              )}

              <span className="hidden sm:inline text-sm text-gray-600">
                {session?.user?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="p-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Today's Schedule Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {todaysSchedule?.name || `${todayName} Workout`}
            </h2>
          </div>
          <p className="text-gray-600">
            Complete your scheduled exercises and add your own if needed
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add My Own Exercise</span>
          </Button>
          
          <Button
            onClick={saveWorkout}
            disabled={saving || workoutExercises.every(ex => ex.sets.every(set => set.reps === 0 && set.weightKg === 0))}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Finish & Save Workout"}</span>
          </Button>
        </div>

        {/* Workout Exercises */}
        <div className="space-y-4">
          {workoutExercises.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">
                  No exercises scheduled for today. Add your own exercises to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            workoutExercises.map((workoutExercise, exerciseIndex) => (
              <Card key={`${workoutExercise.exerciseId}-${exerciseIndex}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center space-x-2">
                        <span className="truncate">{workoutExercise.exercise.name}</span>
                        {workoutExercise.isCustom && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                            Custom
                          </span>
                        )}
                        {workoutExercise.originalExerciseId && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full whitespace-nowrap">
                            Replaced
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {workoutExercise.exercise.muscleGroup} • {workoutExercise.exercise.equipment}
                        {workoutExercise.originalExerciseName && (
                          <span className="block text-xs text-orange-600 mt-1">
                            Originally: {workoutExercise.originalExerciseName}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {/* Replace button - available for all exercises */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReplaceExercise(exerciseIndex)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Replace with similar exercise (useful if machine is taken)"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1 text-xs">Replace</span>
                      </Button>

                      {/* Remove button - only for custom exercises */}
                      {workoutExercise.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomExercise(exerciseIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove custom exercise"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Sets Header */}
                    <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-700">
                      <div>Set</div>
                      <div>Reps</div>
                      <div>Weight (kg)</div>
                      <div></div>
                    </div>
                    
                    {/* Sets */}
                    {workoutExercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                        <div className="text-sm font-medium">{set.setNumber}</div>
                        <Input
                          type="number"
                          value={set.reps || ""}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="h-10"
                        />
                        <Input
                          type="number"
                          step="0.5"
                          value={set.weightKg || ""}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'weightKg', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-10"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSet(exerciseIndex, setIndex)}
                          disabled={workoutExercise.sets.length === 1}
                          className="h-10 w-10 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Add Set Button */}
                    <Button
                      variant="outline"
                      onClick={() => addSet(exerciseIndex)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Set
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Custom Exercise Dialog */}
      <AddCustomExerciseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onExerciseAdded={addCustomExercise}
      />

      {/* Exercise Replacement Dialog */}
      {exerciseToReplace && (
        <ExerciseReplacementDialog
          open={isReplacementDialogOpen}
          onOpenChange={setIsReplacementDialogOpen}
          originalExercise={exerciseToReplace.exercise}
          onExerciseReplaced={handleExerciseReplaced}
        />
      )}
    </div>
  )
}
