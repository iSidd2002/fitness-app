"use client"

import { useState } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DaySchedule {
  id: string
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

interface DayNavigationProps {
  selectedDay: number
  onDaySelect: (dayOfWeek: number) => void
  weeklySchedule?: DaySchedule[]
  loading?: boolean
  className?: string
}

const daysOfWeek = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
]

export function DayNavigation({ 
  selectedDay, 
  onDaySelect, 
  weeklySchedule = [],
  loading = false,
  className 
}: DayNavigationProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(0)
  const today = new Date().getDay()

  // Mobile view: show 3 days at a time
  const visibleDays = daysOfWeek.slice(currentWeekStart, currentWeekStart + 3)

  const handlePrevious = () => {
    if (currentWeekStart > 0) {
      setCurrentWeekStart(currentWeekStart - 1)
    }
  }

  const handleNext = () => {
    if (currentWeekStart < 4) {
      setCurrentWeekStart(currentWeekStart + 1)
    }
  }

  const getDaySchedule = (dayOfWeek: number) => {
    return weeklySchedule.find(schedule => schedule.dayOfWeek === dayOfWeek)
  }

  const getExerciseCount = (dayOfWeek: number) => {
    const daySchedule = getDaySchedule(dayOfWeek)
    return daySchedule?.exercises?.length || 0
  }

  const getDayName = (dayOfWeek: number) => {
    const daySchedule = getDaySchedule(dayOfWeek)
    return daySchedule?.name || daysOfWeek[dayOfWeek]?.label || "Unknown"
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop View - All Days */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Weekly Schedule</h3>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => {
                const exerciseCount = getExerciseCount(day.value)
                const dayName = getDayName(day.value)
                const isToday = day.value === today
                const isSelected = day.value === selectedDay

                return (
                  <Button
                    key={day.value}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onDaySelect(day.value)}
                    className={cn(
                      "flex flex-col h-auto p-3 space-y-1",
                      isSelected && "bg-blue-600 hover:bg-blue-700",
                      isToday && !isSelected && "ring-2 ring-blue-300"
                    )}
                    disabled={loading}
                  >
                    <span className="text-xs font-medium">{day.short}</span>
                    <span className="text-xs truncate max-w-full" title={dayName}>
                      {dayName.split(' ')[0]}
                    </span>
                    <Badge 
                      variant={isSelected ? "secondary" : "outline"} 
                      className={cn(
                        "text-xs px-1 py-0",
                        isSelected && "bg-blue-100 text-blue-800"
                      )}
                    >
                      {exerciseCount}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile View - 3 Days with Navigation */}
      <div className="md:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Schedule</h3>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentWeekStart === 0 || loading}
                  className="p-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentWeekStart >= 4 || loading}
                  className="p-1"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {visibleDays.map((day) => {
                const exerciseCount = getExerciseCount(day.value)
                const dayName = getDayName(day.value)
                const isToday = day.value === today
                const isSelected = day.value === selectedDay

                return (
                  <Button
                    key={day.value}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onDaySelect(day.value)}
                    className={cn(
                      "flex flex-col h-auto p-3 space-y-1",
                      isSelected && "bg-blue-600 hover:bg-blue-700",
                      isToday && !isSelected && "ring-2 ring-blue-300"
                    )}
                    disabled={loading}
                  >
                    <span className="text-xs font-medium">{day.short}</span>
                    <span className="text-xs truncate max-w-full" title={dayName}>
                      {dayName.split(' ')[0]}
                    </span>
                    <Badge 
                      variant={isSelected ? "secondary" : "outline"} 
                      className={cn(
                        "text-xs px-1 py-0",
                        isSelected && "bg-blue-100 text-blue-800"
                      )}
                    >
                      {exerciseCount}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div className="flex justify-center space-x-2">
        {selectedDay !== today && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDaySelect(today)}
            className="text-xs"
          >
            Back to Today
          </Button>
        )}

        {selectedDay !== (today + 1) % 7 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDaySelect((today + 1) % 7)}
            className="text-xs"
          >
            Tomorrow
          </Button>
        )}

        {selectedDay !== (today - 1 + 7) % 7 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDaySelect((today - 1 + 7) % 7)}
            className="text-xs"
          >
            Yesterday
          </Button>
        )}
      </div>

      {/* Current Day Info */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {selectedDay === today ? (
            <span className="text-blue-600 font-medium">Today&apos;s Workout</span>
          ) : (
            <span>
              {daysOfWeek[selectedDay]?.label} Workout
              {selectedDay === (today + 1) % 7 && " (Tomorrow)"}
              {selectedDay === (today - 1 + 7) % 7 && " (Yesterday)"}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
