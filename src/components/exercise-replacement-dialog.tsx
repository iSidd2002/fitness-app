"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Search, RefreshCw, ArrowRight } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExerciseAutoSuggest } from "@/components/exercise-auto-suggest"

interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroup: string
  equipment: string
  videoUrl?: string
  userId?: string
}

interface ExerciseReplacementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalExercise: Exercise
  onExerciseReplaced: (newExercise: Exercise) => void
}

export function ExerciseReplacementDialog({ 
  open, 
  onOpenChange, 
  originalExercise,
  onExerciseReplaced 
}: ExerciseReplacementDialogProps) {
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [similarExercises, setSimilarExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [autoSearchTerm, setAutoSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("search")

  const fetchExercises = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/exercises")
      if (response.ok) {
        const data = await response.json()
        const exercises = data.exercises.filter((ex: Exercise) => ex.id !== originalExercise.id)
        setAllExercises(exercises)

        // Find similar exercises (same muscle group or equipment)
        const similar = exercises.filter((ex: Exercise) =>
          ex.muscleGroup === originalExercise.muscleGroup ||
          ex.equipment === originalExercise.equipment
        )
        setSimilarExercises(similar)
        setFilteredExercises(exercises)
      }
    } catch {
      toast.error("Failed to load exercises")
    } finally {
      setLoading(false)
    }
  }, [originalExercise.id, originalExercise.muscleGroup, originalExercise.equipment])

  useEffect(() => {
    if (open) {
      fetchExercises()
    }
  }, [open, fetchExercises])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredExercises(allExercises)
    } else {
      const filtered = allExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.equipment.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredExercises(filtered)
    }
  }, [allExercises, searchTerm])

  const handleSelectExercise = (exercise: Exercise) => {
    onExerciseReplaced(exercise)
    onOpenChange(false)
    setSearchTerm("")
    setAutoSearchTerm("")
    toast.success(`Replaced "${originalExercise.name}" with "${exercise.name}"`)
  }

  const handleAutoSelectExercise = (exercise: Exercise) => {
    onExerciseReplaced(exercise)
    onOpenChange(false)
    setAutoSearchTerm("")
    setSearchTerm("")
    toast.success(`Replaced "${originalExercise.name}" with "${exercise.name}"`)
  }

  const getExercisesToShow = () => {
    if (activeTab === "similar") {
      return searchTerm ? 
        similarExercises.filter(ex => 
          ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.equipment.toLowerCase().includes(searchTerm.toLowerCase())
        ) : 
        similarExercises
    }
    return filteredExercises
  }

  const exercisesToShow = getExercisesToShow()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Replace Exercise</span>
          </DialogTitle>
          <DialogDescription>
            Find a suitable replacement for this exercise. Similar exercises are shown first.
          </DialogDescription>
        </DialogHeader>

        {/* Original Exercise Display */}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900">Replacing:</h4>
                <p className="text-lg font-semibold text-red-800">{originalExercise.name}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-red-700 border-red-300">
                    {originalExercise.muscleGroup}
                  </Badge>
                  <Badge variant="outline" className="text-red-700 border-red-300">
                    {originalExercise.equipment}
                  </Badge>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              Smart Search
            </TabsTrigger>
            <TabsTrigger value="similar">
              Similar ({similarExercises.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({allExercises.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <TabsContent value="search" className="mt-0">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search for replacement exercise
                  </label>
                  <ExerciseAutoSuggest
                    value={autoSearchTerm}
                    onChange={setAutoSearchTerm}
                    onExerciseSelect={handleAutoSelectExercise}
                    placeholder={`Find replacement for ${originalExercise.name}...`}
                    className="w-full"
                    maxSuggestions={10}
                  />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Type to search all exercises with intelligent matching and relevance scoring
                </div>
              </div>
            </TabsContent>

            {/* Search for other tabs */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Filter exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <TabsContent value="similar" className="mt-0">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">Loading exercises...</div>
                ) : exercisesToShow.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No similar exercises found matching your search." : "No similar exercises found."}
                  </div>
                ) : (
                  exercisesToShow.map((exercise) => {
                    const isSameMuscleGroup = exercise.muscleGroup === originalExercise.muscleGroup
                    const isSameEquipment = exercise.equipment === originalExercise.equipment
                    
                    return (
                      <Card
                        key={exercise.id}
                        className={`cursor-pointer hover:shadow-md transition-all ${
                          isSameMuscleGroup && isSameEquipment ? 'ring-2 ring-green-200 bg-green-50' :
                          isSameMuscleGroup ? 'ring-1 ring-blue-200 bg-blue-50' :
                          isSameEquipment ? 'ring-1 ring-purple-200 bg-purple-50' :
                          'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectExercise(exercise)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium">{exercise.name}</h4>
                                {exercise.userId && (
                                  <Badge variant="secondary" className="text-xs">Custom</Badge>
                                )}
                                {isSameMuscleGroup && isSameEquipment && (
                                  <Badge className="text-xs bg-green-600">Perfect Match</Badge>
                                )}
                                {isSameMuscleGroup && !isSameEquipment && (
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Same Muscle</Badge>
                                )}
                                {!isSameMuscleGroup && isSameEquipment && (
                                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">Same Equipment</Badge>
                                )}
                              </div>
                              {exercise.description && (
                                <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                              )}
                              <div className="flex gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={isSameMuscleGroup ? "border-green-300 text-green-700" : ""}
                                >
                                  {exercise.muscleGroup}
                                </Badge>
                                <Badge 
                                  variant="outline"
                                  className={isSameEquipment ? "border-green-300 text-green-700" : ""}
                                >
                                  {exercise.equipment}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Select
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">Loading exercises...</div>
                ) : exercisesToShow.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No exercises found matching your search." : "No exercises available."}
                  </div>
                ) : (
                  exercisesToShow.map((exercise) => (
                    <Card
                      key={exercise.id}
                      className="cursor-pointer hover:shadow-md transition-shadow hover:bg-gray-50"
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{exercise.name}</h4>
                              {exercise.userId && (
                                <Badge variant="secondary" className="text-xs">Custom</Badge>
                              )}
                            </div>
                            {exercise.description && (
                              <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                            )}
                            <div className="flex gap-2">
                              <Badge variant="outline">{exercise.muscleGroup}</Badge>
                              <Badge variant="outline">{exercise.equipment}</Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Select
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
