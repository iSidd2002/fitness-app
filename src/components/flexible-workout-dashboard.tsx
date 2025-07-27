"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { Plus, Dumbbell, LogOut, Save, Trash2, History, Settings, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddCustomExerciseDialog } from "@/components/add-custom-exercise-dialog"
import { ExerciseReplacementDialog } from "@/components/exercise-replacement-dialog"
import { DayNavigation } from "@/components/day-navigation"
import { DaySwapConfirmationDialog } from "@/components/day-swap-confirmation-dialog"
import { WorkoutStatusIndicator } from "@/components/workout-status-indicator"
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
  exercise: Exercise
  isCustom: boolean
  order: number
  sets: ExerciseSet[]
  originalExerciseId?: string
  originalExerciseName?: string
}

interface DaySchedule {
  id: string
  dayOfWeek: number
  name: string
  exercises: {
    id: string
    exerciseId: string
    exercise: Exercise
    order: number
  }[]
}

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

export function FlexibleWorkoutDashboard() {
  const { session } = useAuthGuard()
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([])
  const [currentDaySchedule, setCurrentDaySchedule] = useState<DaySchedule | null>(null)
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isReplacementDialogOpen, setIsReplacementDialogOpen] = useState(false)
  const [exerciseToReplace, setExerciseToReplace] = useState<{ index: number; exercise: Exercise } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dayLoading, setDayLoading] = useState(false)
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [showSwapDialog, setShowSwapDialog] = useState(false)
  const [swapLoading, setSwapLoading] = useState(false)

  const today = new Date().getDay()

  useEffect(() => {
    fetchWeeklySchedule()
  }, [])

  useEffect(() => {
    fetchDaySchedule(selectedDay)
  }, [selectedDay])

  const fetchWeeklySchedule = async () => {
    try {
      const response = await fetch('/api/schedule/weekly')
      if (response.ok) {
        const data = await response.json()
        setWeeklySchedule(data.schedule || [])
      }
    } catch (error) {
      console.error("Failed to load weekly schedule:", error)
      toast.error("Failed to load weekly schedule")
    } finally {
      setLoading(false)
    }
  }

  const fetchDaySchedule = async (dayOfWeek: number) => {
    setDayLoading(true)
    try {
      const response = await fetch(`/api/schedule/day/${dayOfWeek}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentDaySchedule(data.schedule)
        
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
        } else {
          setWorkoutExercises([])
        }
      }
    } catch (error) {
      console.error("Failed to load day schedule:", error)
      toast.error("Failed to load day schedule")
    } finally {
      setDayLoading(false)
    }
  }

  const handleDaySelect = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek)
    setWorkoutStarted(false) // Reset workout status when switching days
  }

  const handleAddSet = (exerciseIndex: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev]
      const currentSets = updated[exerciseIndex].sets
      const newSetNumber = currentSets.length + 1
      updated[exerciseIndex].sets.push({
        setNumber: newSetNumber,
        reps: 0,
        weightKg: 0
      })
      return updated
    })
  }

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev]
      updated[exerciseIndex].sets.splice(setIndex, 1)
      // Renumber the remaining sets
      updated[exerciseIndex].sets.forEach((set, index) => {
        set.setNumber = index + 1
      })
      return updated
    })
  }

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weightKg', value: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev]
      updated[exerciseIndex].sets[setIndex][field] = value
      return updated
    })
  }

  const handleRemoveExercise = (exerciseIndex: number) => {
    setWorkoutExercises(prev => prev.filter((_, index) => index !== exerciseIndex))
  }

  const handleReplaceExercise = (exerciseIndex: number) => {
    const exercise = workoutExercises[exerciseIndex].exercise
    setExerciseToReplace({ index: exerciseIndex, exercise })
    setIsReplacementDialogOpen(true)
  }

  const handleExerciseReplaced = (newExercise: Exercise) => {
    if (exerciseToReplace) {
      setWorkoutExercises(prev => {
        const updated = [...prev]
        const originalExercise = updated[exerciseToReplace.index].exercise
        updated[exerciseToReplace.index] = {
          ...updated[exerciseToReplace.index],
          exercise: newExercise,
          exerciseId: newExercise.id,
          isCustom: !!newExercise.userId,
          originalExerciseId: originalExercise.id,
          originalExerciseName: originalExercise.name
        }
        return updated
      })
      setExerciseToReplace(null)
      setIsReplacementDialogOpen(false)
    }
  }

  const handleAddCustomExercise = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exercise,
      isCustom: true,
      order: workoutExercises.length + 1,
      sets: [{ setNumber: 1, reps: 0, weightKg: 0 }]
    }
    setWorkoutExercises(prev => [...prev, newWorkoutExercise])
    setIsAddDialogOpen(false)
  }

  const handleStartWorkout = () => {
    if (workoutExercises.length === 0) {
      toast.error("No exercises available for this day. Add some exercises to get started!")
      return
    }

    // Check if we need to swap days (starting a different day's workout)
    if (selectedDay !== today) {
      setShowSwapDialog(true)
      return
    }

    // Starting today's workout - no swap needed
    setWorkoutStarted(true)
    toast.success(`Starting ${currentDaySchedule?.name || daysOfWeek[selectedDay]} workout! 💪`)
  }

  const handleConfirmDaySwap = async () => {
    setSwapLoading(true)
    try {
      const response = await fetch("/api/schedule/swap-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDay: selectedDay,
          toDay: today,
          userId: session?.user?.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to swap days")
      }

      // Update local state
      setWorkoutStarted(true)
      setShowSwapDialog(false)

      // Refresh the weekly schedule and current day
      await Promise.all([
        fetchWeeklySchedule(),
        fetchDaySchedule(selectedDay)
      ])

      toast.success(
        `Days swapped! ${daysOfWeek[today]} is now ${result.swappedDays.fromDayName} and ${daysOfWeek[selectedDay]} is now ${result.swappedDays.toDayName}. Starting workout! 💪`
      )

    } catch (error) {
      console.error("Error swapping days:", error)
      toast.error(error instanceof Error ? error.message : "Failed to swap workout days")
    } finally {
      setSwapLoading(false)
    }
  }

  const handleSaveWorkout = async () => {
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
          dayOfWeek: selectedDay,
          exercises: completedExercises
        })
      })

      if (response.ok) {
        toast.success("Workout saved successfully! 🎉")
        // Reset the workout
        fetchDaySchedule(selectedDay)
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
        <div className="text-lg">Loading workout schedule...</div>
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
                <p className="text-xs text-gray-500">
                  {selectedDay === today ? "Today" : daysOfWeek[selectedDay]}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/history">
                <Button variant="ghost" size="sm" className="p-2">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">History</span>
                </Button>
              </Link>

              {session?.user?.role === "ADMIN" && (
                <Link href="/admin/schedule">
                  <Button variant="ghost" size="sm" className="p-2 text-blue-600 hover:text-blue-700">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Admin</span>
                  </Button>
                </Link>
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
        {/* Day Navigation */}
        <DayNavigation
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
          weeklySchedule={weeklySchedule}
          loading={dayLoading}
          className="mb-6"
        />

        {/* Current Day Header */}
        <div className="mb-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentDaySchedule?.name || `${daysOfWeek[selectedDay]} Workout`}
              </h2>
              <p className="text-gray-600">
                {selectedDay === today
                  ? "Complete your scheduled exercises and add your own if needed"
                  : "Preview or start this day's workout"
                }
              </p>
            </div>

            {/* Workout Status Indicator */}
            <WorkoutStatusIndicator
              status={workoutStarted ? "in_progress" : "not_started"}
              onStartWorkout={handleStartWorkout}
              workoutName={currentDaySchedule?.name}
              exerciseCount={workoutExercises.length}
              completedSets={workoutExercises.reduce((total, ex) =>
                total + ex.sets.filter(set => set.reps > 0 && set.weightKg > 0).length, 0
              )}
              totalSets={workoutExercises.reduce((total, ex) => total + ex.sets.length, 0)}
              disabled={dayLoading || swapLoading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
          
          <Button
            onClick={() => fetchDaySchedule(selectedDay)}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={dayLoading}
          >
            <RefreshCw className={`h-4 w-4 ${dayLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {workoutExercises.some(ex => ex.sets.some(set => set.reps > 0 && set.weightKg > 0)) && (
            <Button
              onClick={handleSaveWorkout}
              disabled={saving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Workout"}
            </Button>
          )}
        </div>

        {/* Loading State */}
        {dayLoading && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-gray-500">Loading exercises...</div>
            </CardContent>
          </Card>
        )}

        {/* Exercise List */}
        {!dayLoading && (
          <div className="space-y-4">
            {workoutExercises.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500 mb-4">
                    No exercises scheduled for {daysOfWeek[selectedDay]}.
                  </p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Exercise
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Exercise Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          {workoutExercises.length} Exercise{workoutExercises.length !== 1 ? 's' : ''} Scheduled
                        </h3>
                        <p className="text-sm text-blue-700">
                          {selectedDay === today
                            ? "Ready to start your workout!"
                            : "Preview mode - you can still start this workout"
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-700">
                          Muscle Groups:
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.from(new Set(workoutExercises.map(ex => ex.exercise.muscleGroup))).map(muscle => (
                            <Badge key={muscle} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Individual Exercises */}
            {workoutExercises.length > 0 && (
              workoutExercises.map((workoutExercise, exerciseIndex) => (
                <Card key={`${workoutExercise.exerciseId}-${exerciseIndex}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center space-x-2">
                          <span className="truncate">{workoutExercise.exercise.name}</span>
                          {workoutExercise.isCustom && (
                            <Badge variant="secondary" className="text-xs">
                              Custom
                            </Badge>
                          )}
                          {workoutExercise.originalExerciseName && (
                            <Badge variant="outline" className="text-xs">
                              Replaced {workoutExercise.originalExerciseName}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {workoutExercise.exercise.muscleGroup}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {workoutExercise.exercise.equipment}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReplaceExercise(exerciseIndex)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExercise(exerciseIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Sets */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-700 mb-2">
                        <span>Set</span>
                        <span>Reps</span>
                        <span>Weight (kg)</span>
                        <span></span>
                      </div>
                      
                      {workoutExercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                          <span className="text-sm text-gray-600">{set.setNumber}</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.reps || ''}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                            className="h-8"
                          />
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="0"
                            value={set.weightKg || ''}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weightKg', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSet(exerciseIndex)}
                        className="w-full mt-2"
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
        )}
      </div>

      {/* Dialogs */}
      <AddCustomExerciseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onExerciseAdded={handleAddCustomExercise}
      />

      {exerciseToReplace && (
        <ExerciseReplacementDialog
          open={isReplacementDialogOpen}
          onOpenChange={setIsReplacementDialogOpen}
          originalExercise={exerciseToReplace.exercise}
          onExerciseReplaced={handleExerciseReplaced}
        />
      )}

      {/* Day Swap Confirmation Dialog */}
      <DaySwapConfirmationDialog
        open={showSwapDialog}
        onOpenChange={setShowSwapDialog}
        fromDay={selectedDay}
        toDay={today}
        fromDayName={currentDaySchedule?.name || daysOfWeek[selectedDay]}
        toDayName={weeklySchedule.find(s => s.dayOfWeek === today)?.name || daysOfWeek[today]}
        onConfirm={handleConfirmDaySwap}
        loading={swapLoading}
      />
    </div>
  )
}
