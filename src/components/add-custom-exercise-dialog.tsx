"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Search, Plus } from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ExerciseAutoSuggest } from "@/components/exercise-auto-suggest"

const createExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  description: z.string().optional(),
  muscleGroup: z.string().min(1, "Please select a muscle group"),
  equipment: z.string().min(1, "Please select equipment type"),
  videoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
})

type CreateExerciseFormData = z.infer<typeof createExerciseSchema>

interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroup: string
  equipment: string
  videoUrl?: string
  userId?: string
}

interface AddCustomExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExerciseAdded: (exercise: Exercise) => void
}

const muscleGroups = [
  "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio", "Full Body"
]

const equipmentTypes = [
  "Barbell", "Dumbbells", "Cable Machine", "Machine", "Bodyweight", 
  "Resistance Bands", "Kettlebell", "Pull-up Bar", "Treadmill", "Other"
]

export function AddCustomExerciseDialog({
  open,
  onOpenChange,
  onExerciseAdded
}: AddCustomExerciseDialogProps) {
  const [myExercises, setMyExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState("search")

  const form = useForm<CreateExerciseFormData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: "",
      description: "",
      muscleGroup: "",
      equipment: "",
      videoUrl: "",
    },
  })

  useEffect(() => {
    if (open) {
      fetchMyExercises()
    }
  }, [open])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredExercises(myExercises)
    } else {
      const filtered = myExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.equipment.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredExercises(filtered)
    }
  }, [myExercises, searchTerm])

  const fetchMyExercises = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/exercises/my")
      if (response.ok) {
        const data = await response.json()
        setMyExercises(data.exercises)
      }
    } catch (error) {
      toast.error("Failed to load your exercises")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectExercise = (exercise: Exercise) => {
    onExerciseAdded(exercise)
    onOpenChange(false)
    setSearchTerm("")
    setExerciseSearchTerm("")
  }

  const handleExerciseAutoSelect = (exercise: Exercise) => {
    onExerciseAdded(exercise)
    onOpenChange(false)
    setExerciseSearchTerm("")
    setSearchTerm("")
  }

  const handleCreateFromSearch = () => {
    if (exerciseSearchTerm.trim()) {
      form.setValue('name', exerciseSearchTerm.trim())
      setActiveTab("create")
    }
  }

  const handleCreateExercise = async (data: CreateExerciseFormData) => {
    setCreating(true)

    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create exercise")
      }

      onExerciseAdded(result.exercise)
      form.reset()
      onOpenChange(false)
      toast.success("Exercise created and added to workout!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create exercise")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise to Today's Workout</DialogTitle>
          <DialogDescription>
            Choose from your custom exercises or create a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search All</TabsTrigger>
            <TabsTrigger value="select">My Exercises</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search for exercises
                </label>
                <ExerciseAutoSuggest
                  value={exerciseSearchTerm}
                  onChange={setExerciseSearchTerm}
                  onExerciseSelect={handleExerciseAutoSelect}
                  placeholder="Type to search all exercises..."
                  showCreateOption={true}
                  onCreateNew={handleCreateFromSearch}
                  className="w-full"
                />
              </div>
              <div className="text-xs text-gray-500 text-center">
                Search across all exercises (global + your custom) or create a new one
              </div>
            </div>
          </TabsContent>

          <TabsContent value="select" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search your exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Exercise List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">Loading your exercises...</div>
              ) : filteredExercises.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchTerm ? "No exercises found matching your search." : "You haven't created any custom exercises yet."}
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <Card
                    key={exercise.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectExercise(exercise)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{exercise.name}</h4>
                          <p className="text-sm text-gray-600">
                            {exercise.muscleGroup} • {exercise.equipment}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateExercise)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bulgarian Split Squat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="muscleGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Muscle Group *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {muscleGroups.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="equipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {equipmentTypes.map((equipment) => (
                              <SelectItem key={equipment} value={equipment}>
                                {equipment}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? "Creating..." : "Create & Add"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
