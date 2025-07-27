"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Search, Plus, Dumbbell, LogOut } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CreateExerciseDialog } from "@/components/create-exercise-dialog"

interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroup: string
  equipment: string
  videoUrl?: string
  userId?: string
  user?: {
    name: string
  }
}

export function WorkoutDashboard() {
  const { data: session } = useSession()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Fetch exercises on component mount
  useEffect(() => {
    fetchExercises()
  }, [])

  // Filter exercises based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredExercises(exercises)
    } else {
      const filtered = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.equipment.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredExercises(filtered)
    }
  }, [exercises, searchTerm])

  const fetchExercises = async () => {
    try {
      const response = await fetch("/api/exercises")
      if (!response.ok) throw new Error("Failed to fetch exercises")
      
      const data = await response.json()
      setExercises(data.exercises)
    } catch (error) {
      toast.error("Failed to load exercises")
      console.error("Error fetching exercises:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExerciseToggle = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises)
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId)
    } else {
      newSelected.add(exerciseId)
    }
    setSelectedExercises(newSelected)
  }

  const handleStartWorkout = () => {
    if (selectedExercises.size === 0) {
      toast.error("Please select at least one exercise to start your workout")
      return
    }
    
    const selectedExerciseList = exercises.filter(ex => selectedExercises.has(ex.id))
    toast.success(`Starting workout with ${selectedExercises.size} exercises!`)
    // TODO: Navigate to workout session page
    console.log("Selected exercises:", selectedExerciseList)
  }

  const handleExerciseCreated = (newExercise: Exercise) => {
    setExercises(prev => [...prev, newExercise])
    toast.success("Custom exercise created successfully!")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading exercises...</div>
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
              <h1 className="text-xl font-bold text-gray-900">Siddhant&apos;s Workout Plan</h1>
            </div>
            
            <div className="flex items-center space-x-2">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}!
          </h2>
          <p className="text-gray-600">
            Select exercises to build your workout
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Custom Exercise</span>
          </Button>
          
          <Button
            onClick={handleStartWorkout}
            disabled={selectedExercises.size === 0}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Dumbbell className="h-4 w-4" />
            <span>
              Start Workout {selectedExercises.size > 0 && `(${selectedExercises.size})`}
            </span>
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search exercises by name, muscle group, or equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Exercise list */}
        <div className="space-y-3">
          {filteredExercises.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">
                  {searchTerm ? "No exercises found matching your search." : "No exercises available."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedExercises.has(exercise.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => handleExerciseToggle(exercise.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedExercises.has(exercise.id)}
                      onCheckedChange={() => handleExerciseToggle(exercise.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {exercise.name}
                        </h3>
                        {exercise.userId && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                            Custom
                          </span>
                        )}
                      </div>
                      
                      {exercise.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {exercise.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {exercise.muscleGroup}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {exercise.equipment}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Selected exercises summary */}
        {selectedExercises.size > 0 && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {selectedExercises.size} exercise{selectedExercises.size !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    onClick={handleStartWorkout}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Start Workout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Exercise Dialog */}
      <CreateExerciseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onExerciseCreated={handleExerciseCreated}
      />
    </div>
  )
}
