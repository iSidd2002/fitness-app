"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Loader2, Globe } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"

const createGlobalExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  description: z.string().optional(),
  muscleGroup: z.string().min(1, "Please select a muscle group"),
  equipment: z.string().min(1, "Please select equipment type"),
  videoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  assignToDays: z.array(z.number()).optional(),
})

type CreateGlobalExerciseFormData = z.infer<typeof createGlobalExerciseSchema>

interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroup: string
  equipment: string
  videoUrl?: string
  userId?: string
  isGlobal?: boolean
}

interface AdminCreateExerciseDialogProps {
  onExerciseCreated?: (exercise: Exercise) => void
  trigger?: React.ReactNode
}

const muscleGroups = [
  "Chest",
  "Back", 
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
  "Full Body"
]

const equipmentTypes = [
  "Barbell",
  "Dumbbells",
  "Cable Machine",
  "Machine",
  "Bodyweight",
  "Resistance Bands",
  "Kettlebell",
  "Pull-up Bar",
  "Treadmill",
  "Other"
]

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

export function AdminCreateExerciseDialog({
  onExerciseCreated,
  trigger
}: AdminCreateExerciseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  const form = useForm<CreateGlobalExerciseFormData>({
    resolver: zodResolver(createGlobalExerciseSchema),
    defaultValues: {
      name: "",
      description: "",
      muscleGroup: "",
      equipment: "",
      videoUrl: "",
      assignToDays: [],
    },
  })

  const onSubmit = async (data: CreateGlobalExerciseFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/exercises/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          assignToDays: selectedDays
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create global exercise")
      }

      const successMessage = selectedDays.length > 0
        ? `Global exercise created and added to ${selectedDays.length} day${selectedDays.length !== 1 ? 's' : ''}! 🌍`
        : "Global exercise created successfully! 🌍"

      toast.success(successMessage)
      onExerciseCreated?.(result.exercise)
      form.reset()
      setSelectedDays([])
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create exercise")
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Create Global Exercise
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Create Global Exercise
          </DialogTitle>
          <DialogDescription>
            Create a new exercise that will be available to all users. This exercise will appear in the global exercise database.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Globe className="h-4 w-4" />
              <p className="text-sm font-medium">
                Admin Exercise - Available to All Users
              </p>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Incline Dumbbell Press" {...field} />
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
                    <Input 
                      placeholder="Brief description of the exercise..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="muscleGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Muscle Group *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select muscle group" />
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
                        <SelectValue placeholder="Select equipment type" />
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

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://youtube.com/watch?v=..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Day Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Assign to Days (Optional)</Label>
              <p className="text-xs text-gray-500">Select which days this exercise should be added to the schedule</p>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = selectedDays.includes(day.value)
                  return (
                    <Button
                      key={day.value}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDays(prev => prev.filter(d => d !== day.value))
                        } else {
                          setSelectedDays(prev => [...prev, day.value])
                        }
                      }}
                      className={`justify-start ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      {day.label}
                    </Button>
                  )
                })}
              </div>
              {selectedDays.length > 0 && (
                <p className="text-xs text-blue-600">
                  Will be added to: {selectedDays.map(d => daysOfWeek.find(day => day.value === d)?.label).join(', ')}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Creating..." : "Create Global Exercise"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
