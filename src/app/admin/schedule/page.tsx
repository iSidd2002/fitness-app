"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Search, Plus, Trash2, GripVertical, Settings, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ExerciseAutoSuggest } from "@/components/exercise-auto-suggest"
import { AuthGuard } from "@/components/auth-guard"

interface Exercise {
  id: string
  name: string
  muscleGroup: string
  equipment: string
}

interface ScheduleExercise {
  id: string
  exerciseId: string
  order: number
  exercise: Exercise
}

interface DaySchedule {
  id: string
  dayOfWeek: number
  name: string
  exercises: ScheduleExercise[]
}

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

function AdminSchedulePageContent() {
  const { data: session } = useSession()
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [selectedExercise, setSelectedExercise] = useState<string>("")
  const [dayName, setDayName] = useState<string>("")
  const [exerciseSearch, setExerciseSearch] = useState<string>("")
  const [exerciseAutoSearch, setExerciseAutoSearch] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  // Filter exercises based on search
  useEffect(() => {
    if (!exerciseSearch.trim()) {
      setFilteredExercises(exercises)
    } else {
      const filtered = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.equipment.toLowerCase().includes(exerciseSearch.toLowerCase())
      )
      setFilteredExercises(filtered)
    }
  }, [exercises, exerciseSearch])

  const fetchData = async () => {
    try {
      const [scheduleRes, exercisesRes] = await Promise.all([
        fetch("/api/admin/schedule"),
        fetch("/api/exercises/global")
      ])

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json()
        setSchedule(scheduleData.schedule)
      } else {
        toast.error("Failed to load schedule data")
      }

      if (exercisesRes.ok) {
        const exercisesData = await exercisesRes.json()
        setExercises(exercisesData.exercises)
        setFilteredExercises(exercisesData.exercises)
      } else {
        toast.error("Failed to load exercises")
      }
    } catch (error) {
      toast.error("Failed to load data")
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoExerciseSelect = async (exercise: any) => {
    // Check if exercise already exists in the selected day
    const daySchedule = schedule.find(s => s.dayOfWeek === selectedDay)
    const exerciseExists = daySchedule?.exercises.some(ex => ex.exerciseId === exercise.id)

    if (exerciseExists) {
      toast.error("This exercise is already scheduled for this day")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: selectedDay,
          exerciseId: exercise.id,
          name: dayName || daysOfWeek.find(d => d.value === selectedDay)?.label
        })
      })

      if (response.ok) {
        toast.success(`"${exercise.name}" added to ${daysOfWeek.find(d => d.value === selectedDay)?.label}`)
        fetchData()
        setExerciseAutoSearch("")
        setDayName("")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to add exercise")
      }
    } catch (error) {
      toast.error("Failed to add exercise")
      console.error("Error adding exercise:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddExercise = async () => {
    if (!selectedExercise || selectedDay === null) {
      toast.error("Please select both a day and an exercise")
      return
    }

    // Check if exercise already exists in the selected day
    const daySchedule = schedule.find(s => s.dayOfWeek === selectedDay)
    const exerciseExists = daySchedule?.exercises.some(ex => ex.exerciseId === selectedExercise)

    if (exerciseExists) {
      toast.error("This exercise is already scheduled for this day")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: selectedDay,
          exerciseId: selectedExercise,
          name: dayName || daysOfWeek.find(d => d.value === selectedDay)?.label
        })
      })

      if (response.ok) {
        toast.success("Exercise added to schedule")
        fetchData()
        setSelectedExercise("")
        setDayName("")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to add exercise")
      }
    } catch (error) {
      toast.error("Failed to add exercise")
      console.error("Error adding exercise:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveExercise = async (scheduleExerciseId: string, exerciseName: string) => {
    if (!confirm(`Are you sure you want to remove "${exerciseName}" from the schedule?`)) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/schedule/${scheduleExerciseId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success(`"${exerciseName}" removed from schedule`)
        fetchData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to remove exercise")
      }
    } catch (error) {
      toast.error("Failed to remove exercise")
      console.error("Error removing exercise:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const dayOfWeek = parseInt(result.droppableId)
    const daySchedule = schedule.find(s => s.dayOfWeek === dayOfWeek)
    if (!daySchedule) return

    const items = Array.from(daySchedule.exercises)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update local state immediately
    const newSchedule = schedule.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { ...s, exercises: items.map((item, index) => ({ ...item, order: index + 1 })) }
        : s
    )
    setSchedule(newSchedule)

    // Update backend
    try {
      await fetch("/api/admin/schedule/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          exercises: items.map((item, index) => ({ id: item.id, order: index + 1 }))
        })
      })
    } catch (error) {
      toast.error("Failed to reorder exercises")
      fetchData() // Revert on error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    )
  }

  const currentDaySchedule = schedule.find(s => s.dayOfWeek === selectedDay)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>

              <div className="flex items-center space-x-2">
                <Settings className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-xs text-gray-500">Weekly Schedule Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline text-sm text-gray-600">
                {session?.user?.name}
              </span>
              <Badge variant="secondary">Admin</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Weekly Workout Schedule
          </h2>
          <p className="text-gray-600 mb-4">
            Manage exercises for each day of the week. Changes will immediately affect all users.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {schedule.reduce((total, day) => total + (day.exercises?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Exercises</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {schedule.filter(day => day.exercises && day.exercises.length > 0).length}
                </div>
                <div className="text-sm text-gray-600">Active Days</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {exercises.length}
                </div>
                <div className="text-sm text-gray-600">Available Exercises</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(schedule.flatMap(day => day.exercises?.map(ex => ex.exercise.muscleGroup) || [])).size}
                </div>
                <div className="text-sm text-gray-600">Muscle Groups</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Add Exercise Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add Exercise to Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Smart Search Method (Primary) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="exercise">Search & Add Exercise</Label>
                  <ExerciseAutoSuggest
                    value={exerciseAutoSearch}
                    onChange={setExerciseAutoSearch}
                    onExerciseSelect={handleAutoExerciseSelect}
                    placeholder="Type to search and add exercise..."
                    className="w-full"
                    disabled={saving}
                    maxSuggestions={8}
                  />
                </div>

                <div>
                  <Label htmlFor="dayName">Day Name (Optional)</Label>
                  <Input
                    id="dayName"
                    value={dayName}
                    onChange={(e) => setDayName(e.target.value)}
                    placeholder="e.g., Push Day"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or use traditional method</span>
                </div>
              </div>

              {/* Traditional Method (Secondary) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="exercise">Exercise</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Filter exercises..."
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                        className="pl-10"
                        disabled={saving}
                      />
                    </div>
                    <Select value={selectedExercise} onValueChange={setSelectedExercise} disabled={saving}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exercise" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredExercises.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{exercise.name}</span>
                              <span className="text-xs text-gray-500">
                                {exercise.muscleGroup} • {exercise.equipment}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleAddExercise}
                    disabled={!selectedExercise || saving}
                    className="w-full"
                    variant="outline"
                  >
                    {saving ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Selected
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Display */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule Overview</h3>
            <Badge variant="outline" className="text-xs">
              {schedule.reduce((total, day) => total + (day.exercises?.length || 0), 0)} total exercises
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {daysOfWeek.map((day) => {
              const daySchedule = schedule.find(s => s.dayOfWeek === day.value)
              const exerciseCount = daySchedule?.exercises.length || 0

              return (
                <Card key={day.value} className="h-fit">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{day.label}</CardTitle>
                      <Badge variant={exerciseCount > 0 ? "default" : "secondary"} className="text-xs">
                        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {daySchedule?.name && daySchedule.name !== day.label && (
                      <p className="text-sm text-blue-600 font-medium">{daySchedule.name}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId={day.value.toString()}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-2 min-h-[100px] p-2 rounded-lg transition-colors ${
                              snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'bg-gray-50'
                            }`}
                          >
                            {daySchedule?.exercises
                              .sort((a, b) => a.order - b.order)
                              .map((scheduleExercise, index) => (
                                <Draggable
                                  key={scheduleExercise.id}
                                  draggableId={scheduleExercise.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`bg-white border rounded-lg p-3 shadow-sm transition-all ${
                                        snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2">
                                            <div
                                              {...provided.dragHandleProps}
                                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                                            >
                                              <GripVertical className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                              <p className="font-medium text-sm truncate">
                                                {scheduleExercise.exercise.name}
                                              </p>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                  {scheduleExercise.exercise.muscleGroup}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                  {scheduleExercise.exercise.equipment}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveExercise(scheduleExercise.id, scheduleExercise.exercise.name)}
                                          disabled={saving}
                                          className="ml-2 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {(!daySchedule?.exercises || daySchedule.exercises.length === 0) && (
                              <div className="text-center py-8">
                                <p className="text-gray-400 text-sm">No exercises scheduled</p>
                                <p className="text-gray-400 text-xs mt-1">Drag exercises here or use the form above</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-blue-900 mb-3">💡 Admin Tips</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">🎯 Drag & Drop</p>
                <p>Drag exercises within each day to reorder them</p>
              </div>
              <div>
                <p className="font-medium mb-1">🔍 Search Exercises</p>
                <p>Use the search box to quickly find exercises</p>
              </div>
              <div>
                <p className="font-medium mb-1">🚫 Duplicate Prevention</p>
                <p>Can't add the same exercise twice to one day</p>
              </div>
              <div>
                <p className="font-medium mb-1">⚡ Real-time Updates</p>
                <p>Changes immediately affect all user dashboards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminSchedulePage() {
  return (
    <AuthGuard requireAdmin={true}>
      <AdminSchedulePageContent />
    </AuthGuard>
  )
}
