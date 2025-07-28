"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit3, Trash2, Save, X, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface ExerciseSet {
  id: string
  setNumber: number
  reps: number
  weightKg: number
}

interface WorkoutExercise {
  id: string
  exercise: {
    id: string
    name: string
    muscleGroup: string
  }
  sets: ExerciseSet[]
}

interface WorkoutLog {
  id: string
  date: string
  workoutExercises: WorkoutExercise[]
}

interface EditWorkoutDialogProps {
  workout: WorkoutLog
  onWorkoutUpdated: () => void
  children: React.ReactNode
}

export function EditWorkoutDialog({ workout, onWorkoutUpdated, children }: EditWorkoutDialogProps) {
  const [open, setOpen] = useState(false)
  const [editingSets, setEditingSets] = useState<{ [key: string]: ExerciseSet[] }>({})
  const [loading, setLoading] = useState(false)

  // Initialize editing sets when dialog opens
  const initializeEditingSets = () => {
    const initialSets: { [key: string]: ExerciseSet[] } = {}
    workout.workoutExercises.forEach(we => {
      initialSets[we.id] = [...we.sets]
    })
    setEditingSets(initialSets)
  }

  const handleSetChange = (workoutExerciseId: string, setIndex: number, field: keyof ExerciseSet, value: string | number) => {
    setEditingSets(prev => ({
      ...prev,
      [workoutExerciseId]: prev[workoutExerciseId].map((set, index) =>
        index === setIndex ? { ...set, [field]: value } : set
      )
    }))
  }

  const handleSaveExercise = async (workoutExerciseId: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/workout/history/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutLogId: workout.id,
          action: 'edit_sets',
          data: {
            workoutExerciseId,
            sets: editingSets[workoutExerciseId]
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update exercise')
      }

      toast.success('Exercise updated successfully!')
      onWorkoutUpdated()
    } catch (error) {
      console.error('Error updating exercise:', error)
      toast.error('Failed to update exercise')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveExercise = async (workoutExerciseId: string, exerciseName: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/workout/history/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutLogId: workout.id,
          action: 'remove_exercise',
          data: { workoutExerciseId }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to remove exercise')
      }

      toast.success(`${exerciseName} removed from workout`)
      onWorkoutUpdated()
      setOpen(false)
    } catch (error) {
      console.error('Error removing exercise:', error)
      toast.error('Failed to remove exercise')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkout = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/workout/history/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutLogId: workout.id,
          action: 'delete_workout',
          data: {}
        })
      })

      if (!response.ok) {
        throw new Error('Failed to delete workout')
      }

      toast.success('Workout deleted successfully')
      onWorkoutUpdated()
      setOpen(false)
    } catch (error) {
      console.error('Error deleting workout:', error)
      toast.error('Failed to delete workout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen) {
        initializeEditingSets()
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Workout - {format(new Date(workout.date), 'MMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            Modify exercise sets, remove exercises, or delete the entire workout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {workout.workoutExercises.map((workoutExercise) => (
            <div key={workoutExercise.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{workoutExercise.exercise.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {workoutExercise.exercise.muscleGroup}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSaveExercise(workoutExercise.id)}
                    disabled={loading}
                    size="sm"
                    className="mobile-button"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="mobile-button">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Exercise</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove &quot;{workoutExercise.exercise.name}&quot; from this workout?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveExercise(workoutExercise.id, workoutExercise.exercise.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-600">
                  <div>Set</div>
                  <div>Reps</div>
                  <div>Weight (kg)</div>
                </div>
                
                {editingSets[workoutExercise.id]?.map((set, setIndex) => (
                  <div key={set.id} className="grid grid-cols-3 gap-2">
                    <div className="flex items-center">
                      <Badge variant="outline">{set.setNumber}</Badge>
                    </div>
                    <Input
                      type="number"
                      value={set.reps}
                      onChange={(e) => handleSetChange(workoutExercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                      className="mobile-input"
                      min="0"
                      max="1000"
                    />
                    <Input
                      type="number"
                      step="0.5"
                      value={set.weightKg}
                      onChange={(e) => handleSetChange(workoutExercise.id, setIndex, 'weightKg', parseFloat(e.target.value) || 0)}
                      className="mobile-input"
                      min="0"
                      max="1000"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mobile-button">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Entire Workout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this entire workout from {format(new Date(workout.date), 'MMM d, yyyy')}?
                  This will remove all exercises and sets. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteWorkout}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Workout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={() => setOpen(false)} variant="outline" className="mobile-button">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
