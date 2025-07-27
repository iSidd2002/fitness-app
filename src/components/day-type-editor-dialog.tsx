"use client"

import { useState, useEffect } from "react"
import { Check, Calendar, AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DayTypeEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dayOfWeek: number
  currentDayName: string
  exerciseCount: number
  onSave: (newDayName: string) => Promise<void>
  loading?: boolean
}

const predefinedWorkoutTypes = [
  {
    id: "push",
    name: "Push Day",
    description: "Chest, Shoulders, Triceps",
    color: "bg-red-100 text-red-800"
  },
  {
    id: "pull",
    name: "Pull Day", 
    description: "Back, Biceps",
    color: "bg-blue-100 text-blue-800"
  },
  {
    id: "legs",
    name: "Leg Day",
    description: "Quads, Hamstrings, Glutes, Calves",
    color: "bg-green-100 text-green-800"
  },
  {
    id: "upper",
    name: "Upper Body",
    description: "All upper body muscles",
    color: "bg-purple-100 text-purple-800"
  },
  {
    id: "lower",
    name: "Lower Body", 
    description: "All lower body muscles",
    color: "bg-orange-100 text-orange-800"
  },
  {
    id: "fullbody",
    name: "Full Body",
    description: "Complete body workout",
    color: "bg-indigo-100 text-indigo-800"
  },
  {
    id: "cardio",
    name: "Cardio & Core",
    description: "Cardiovascular and core training",
    color: "bg-pink-100 text-pink-800"
  },
  {
    id: "recovery",
    name: "Active Recovery",
    description: "Light movement and stretching",
    color: "bg-yellow-100 text-yellow-800"
  },
  {
    id: "rest",
    name: "Rest Day",
    description: "Complete rest and recovery",
    color: "bg-gray-100 text-gray-800"
  },
  {
    id: "custom",
    name: "Custom",
    description: "Enter your own workout type",
    color: "bg-teal-100 text-teal-800"
  }
]

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

export function DayTypeEditorDialog({
  open,
  onOpenChange,
  dayOfWeek,
  currentDayName,
  exerciseCount,
  onSave,
  loading = false
}: DayTypeEditorDialogProps) {
  const [selectedType, setSelectedType] = useState("")
  const [customName, setCustomName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize selected type when dialog opens
  useEffect(() => {
    if (open) {
      // Try to match current day name with predefined types
      const matchedType = predefinedWorkoutTypes.find(type => 
        type.name.toLowerCase() === currentDayName.toLowerCase()
      )
      
      if (matchedType) {
        setSelectedType(matchedType.id)
        setCustomName("")
      } else {
        setSelectedType("custom")
        setCustomName(currentDayName)
      }
    }
  }, [open, currentDayName])

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      let newDayName = ""
      
      if (selectedType === "custom") {
        if (!customName.trim()) {
          throw new Error("Please enter a custom workout type name")
        }
        newDayName = customName.trim()
      } else {
        const selectedWorkoutType = predefinedWorkoutTypes.find(type => type.id === selectedType)
        if (!selectedWorkoutType) {
          throw new Error("Please select a workout type")
        }
        newDayName = selectedWorkoutType.name
      }

      await onSave(newDayName)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving day type:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedWorkoutType = predefinedWorkoutTypes.find(type => type.id === selectedType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg mx-4 rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-lg font-semibold">
            Edit {daysOfWeek[dayOfWeek]} Workout Type
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Change the workout type for this day. This will update the schedule for all users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning for days with exercises */}
          {exerciseCount > 0 && (
            <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">This day has {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</p>
                <p>Changing the workout type won&apos;t affect existing exercises, but may confuse users if the exercises don&apos;t match the new type.</p>
              </div>
            </div>
          )}

          {/* Current type display */}
          <Card className="border-gray-200">
            <CardContent className="p-3">
              <div className="text-sm">
                <span className="text-gray-600">Current: </span>
                <span className="font-medium">{currentDayName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Workout type selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select New Workout Type</Label>
            
            <RadioGroup value={selectedType} onValueChange={setSelectedType}>
              <div className="grid grid-cols-1 gap-2">
                {predefinedWorkoutTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.id} id={type.id} />
                    <label
                      htmlFor={type.id}
                      className="flex-1 flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{type.name}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                      <Badge className={`text-xs ${type.color} border-0`}>
                        {type.name === currentDayName && "Current"}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {/* Custom input */}
            {selectedType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customName" className="text-sm">Custom Workout Type Name</Label>
                <Input
                  id="customName"
                  placeholder="Enter custom workout type..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Preview */}
          {(selectedType && selectedType !== "custom") || (selectedType === "custom" && customName.trim()) ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="text-sm">
                  <span className="text-green-700 font-medium">Preview: </span>
                  <span className="text-green-800">
                    {daysOfWeek[dayOfWeek]} will become &ldquo;{selectedType === 'custom' ? customName.trim() : selectedWorkoutType?.name}&rdquo;
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || loading}
              className="flex-1 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isSubmitting || 
                loading || 
                !selectedType || 
                (selectedType === "custom" && !customName.trim())
              }
              className="flex-1 order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            This change will be visible to all users immediately.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
