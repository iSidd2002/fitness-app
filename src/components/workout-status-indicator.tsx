"use client"

import { Play, CheckCircle, Clock, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface WorkoutStatusIndicatorProps {
  status: "not_started" | "in_progress" | "completed"
  onStartWorkout?: () => void
  workoutName?: string
  exerciseCount?: number
  completedSets?: number
  totalSets?: number
  disabled?: boolean
  className?: string
}

export function WorkoutStatusIndicator({
  status,
  onStartWorkout,
  workoutName,
  exerciseCount = 0,
  completedSets = 0,
  totalSets = 0,
  disabled = false,
  className = ""
}: WorkoutStatusIndicatorProps) {
  
  const getStatusConfig = () => {
    switch (status) {
      case "not_started":
        return {
          icon: Play,
          text: "Start Workout",
          subtext: exerciseCount > 0 ? `${exerciseCount} exercises ready` : "No exercises",
          bgColor: "bg-green-600 hover:bg-green-700",
          textColor: "text-white",
          badgeColor: "bg-green-100 text-green-800",
          showButton: true
        }
      case "in_progress":
        return {
          icon: Dumbbell,
          text: "Workout in Progress",
          subtext: totalSets > 0 ? `${completedSets}/${totalSets} sets completed` : "Log your sets below",
          bgColor: "bg-blue-600",
          textColor: "text-white",
          badgeColor: "bg-blue-100 text-blue-800",
          showButton: false
        }
      case "completed":
        return {
          icon: CheckCircle,
          text: "Workout Completed",
          subtext: "Great job! Check your history for details",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          badgeColor: "bg-gray-100 text-gray-600",
          showButton: false
        }
      default:
        return {
          icon: Clock,
          text: "Loading...",
          subtext: "",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          badgeColor: "bg-gray-100 text-gray-600",
          showButton: false
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  if (config.showButton && exerciseCount > 0) {
    // Show start workout button
    return (
      <Button
        onClick={onStartWorkout}
        disabled={disabled}
        className={`${config.bgColor} ${config.textColor} gap-2 ${className}`}
        size="lg"
      >
        <IconComponent className="h-5 w-5" />
        <div className="flex flex-col items-start">
          <span className="font-medium">{config.text}</span>
          {config.subtext && (
            <span className="text-xs opacity-90">{config.subtext}</span>
          )}
        </div>
      </Button>
    )
  }

  if (status === "not_started" && exerciseCount === 0) {
    // Show no exercises state
    return (
      <Card className={`border-dashed border-gray-300 ${className}`}>
        <CardContent className="p-4 text-center">
          <div className="text-gray-500">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No exercises scheduled</p>
            <p className="text-xs">Add exercises to start your workout</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show status indicator (in progress or completed)
  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${config.badgeColor}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 truncate">
                {config.text}
              </h3>
              {status === "in_progress" && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  Active
                </Badge>
              )}
            </div>
            {config.subtext && (
              <p className="text-sm text-gray-600 mt-1">{config.subtext}</p>
            )}
            {workoutName && (
              <p className="text-xs text-gray-500 mt-1">
                {workoutName}
              </p>
            )}
          </div>
          
          {status === "in_progress" && totalSets > 0 && (
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {Math.round((completedSets / totalSets) * 100)}%
              </div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          )}
        </div>
        
        {/* Progress bar for in-progress workouts */}
        {status === "in_progress" && totalSets > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSets / totalSets) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
