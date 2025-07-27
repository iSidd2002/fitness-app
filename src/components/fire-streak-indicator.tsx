"use client"

import { useState, useEffect } from "react"
import { Flame, TrendingUp, Calendar, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  thisWeekWorkouts: number
}

interface FireStreakIndicatorProps {
  className?: string
}

export function FireStreakIndicator({ className }: FireStreakIndicatorProps) {
  const [data, setData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchStreakData()

    // Listen for workout save events to refresh streak data
    const handleWorkoutSaved = () => {
      fetchStreakData()
    }

    window.addEventListener('workoutSaved', handleWorkoutSaved)

    return () => {
      window.removeEventListener('workoutSaved', handleWorkoutSaved)
    }
  }, [])

  const fetchStreakData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workout/streak')
      if (!response.ok) {
        throw new Error('Failed to fetch streak data')
      }
      const streakData = await response.json()
      setData(streakData)
    } catch (error) {
      console.error('Error fetching streak data:', error)
      setError('Failed to load streak data')
    } finally {
      setLoading(false)
    }
  }

  const getStreakColor = (streak: number): string => {
    if (streak === 0) return 'text-gray-400'
    if (streak < 3) return 'text-orange-500'
    if (streak < 7) return 'text-orange-600'
    if (streak < 14) return 'text-red-500'
    if (streak < 30) return 'text-red-600'
    return 'text-red-700'
  }

  const getStreakMessage = (streak: number): string => {
    if (streak === 0) return "Start your streak today!"
    if (streak === 1) return "Great start! Keep it going!"
    if (streak < 7) return "Building momentum!"
    if (streak < 14) return "You're on fire!"
    if (streak < 30) return "Incredible dedication!"
    return "Legendary streak!"
  }

  const getMotivationalMessage = (streak: number): string => {
    if (streak === 0) return "Every journey begins with a single workout. Start today!"
    if (streak < 3) return "Consistency is key. You're building a great habit!"
    if (streak < 7) return "Amazing! You're developing real discipline!"
    if (streak < 14) return "Outstanding! You're in the zone!"
    if (streak < 30) return "Phenomenal! You're a workout machine!"
    return "Absolutely legendary! You're an inspiration!"
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <Flame className="h-5 w-5" />
        <span className="text-sm">--</span>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 hover:bg-orange-50 hover:text-orange-700 transition-colors ${className}`}
        >
          <Flame className={`h-5 w-5 ${getStreakColor(data.currentStreak)}`} />
          <span className={`font-bold text-sm ${getStreakColor(data.currentStreak)}`}>
            {data.currentStreak}
          </span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className={`h-6 w-6 ${getStreakColor(data.currentStreak)}`} />
            Workout Streak
          </DialogTitle>
          <DialogDescription>
            {getMotivationalMessage(data.currentStreak)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Streak Card */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className={`h-8 w-8 ${getStreakColor(data.currentStreak)}`} />
                  <span className={`text-3xl font-bold ${getStreakColor(data.currentStreak)}`}>
                    {data.currentStreak}
                  </span>
                </div>
                <p className="text-sm font-medium text-orange-800">
                  {getStreakMessage(data.currentStreak)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {data.currentStreak === 1 ? 'Day' : 'Days'} in a row
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Best Streak
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-600">
                  {data.longestStreak}
                </div>
                <p className="text-xs text-gray-600">
                  {data.longestStreak === 1 ? 'day' : 'days'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Total Workouts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-blue-600">
                  {data.totalWorkouts}
                </div>
                <p className="text-xs text-gray-600">
                  all time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* This Week Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-purple-600">
                  {data.thisWeekWorkouts}
                </span>
                <Badge variant={data.thisWeekWorkouts >= 3 ? "default" : "secondary"}>
                  {data.thisWeekWorkouts}/7 days
                </Badge>
              </div>
              
              {/* Week Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((data.thisWeekWorkouts / 7) * 100, 100)}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-600 mt-2">
                {data.thisWeekWorkouts >= 5 
                  ? "Excellent week!" 
                  : data.thisWeekWorkouts >= 3 
                  ? "Good progress!" 
                  : "Keep pushing!"}
              </p>
            </CardContent>
          </Card>

          {/* Streak Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Streak Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Consistency beats intensity</li>
                <li>• Even 10 minutes counts</li>
                <li>• Plan rest days strategically</li>
                <li>• Track your progress daily</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for other components to refresh streak data
export function useStreakRefresh() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const refreshStreak = () => {
    setRefreshTrigger(prev => prev + 1)
  }
  
  return { refreshStreak, refreshTrigger }
}
