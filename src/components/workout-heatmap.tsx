"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Flame } from "lucide-react"

interface HeatmapData {
  date: string
  count: number
  intensity: number
  totalSets: number
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  thisWeekWorkouts: number
  heatmapData: HeatmapData[]
}

interface WorkoutHeatmapProps {
  className?: string
}

export function WorkoutHeatmap({ className }: WorkoutHeatmapProps) {
  const [data, setData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    fetchStreakData()

    // Listen for workout save events to refresh heatmap data
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
      setError('Failed to load workout data')
    } finally {
      setLoading(false)
    }
  }

  const getIntensityColor = (intensity: number): string => {
    switch (intensity) {
      case 0: return 'bg-gray-100 dark:bg-gray-800'
      case 1: return 'bg-green-200 dark:bg-green-900'
      case 2: return 'bg-green-300 dark:bg-green-700'
      case 3: return 'bg-green-500 dark:bg-green-600'
      case 4: return 'bg-green-700 dark:bg-green-500'
      default: return 'bg-gray-100 dark:bg-gray-800'
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getMonthLabels = () => {
    if (!data?.heatmapData) return []
    
    const months: { label: string; startIndex: number }[] = []
    let currentMonth = -1
    
    data.heatmapData.forEach((item, index) => {
      const date = new Date(item.date)
      const month = date.getMonth()
      
      if (month !== currentMonth) {
        currentMonth = month
        months.push({
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          startIndex: index
        })
      }
    })
    
    return months
  }

  const getDayLabels = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const organizeDataByWeeks = () => {
    if (!data?.heatmapData) return []
    
    const weeks: HeatmapData[][] = []
    let currentWeek: HeatmapData[] = []
    
    data.heatmapData.forEach((item, index) => {
      const date = new Date(item.date)
      const dayOfWeek = date.getDay()
      
      // If it's Sunday and we have data, start a new week
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push([...currentWeek])
        currentWeek = []
      }
      
      currentWeek.push(item)
      
      // If it's the last item, push the current week
      if (index === data.heatmapData.length - 1) {
        weeks.push(currentWeek)
      }
    })
    
    return weeks
  }

  const handleCellHover = (item: HeatmapData, event: React.MouseEvent) => {
    setHoveredCell(item)
    setTooltipPosition({ x: event.clientX, y: event.clientY })
  }

  const handleCellLeave = () => {
    setHoveredCell(null)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Workout Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-16 w-24" />
              <Skeleton className="h-16 w-24" />
              <Skeleton className="h-16 w-24" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error || 'No workout data available'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const weeks = organizeDataByWeeks()
  const monthLabels = getMonthLabels()
  const dayLabels = getDayLabels()

  return (
    <>
      <Card className={`mobile-card ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Workout Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats Row */}
          <div className="heatmap-stats grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                <Flame className="h-6 w-6" />
                {data.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.longestStreak}</div>
              <div className="text-sm text-gray-600">Longest Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.totalWorkouts}</div>
              <div className="text-sm text-gray-600">Total Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.thisWeekWorkouts}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Month labels */}
              <div className="flex mb-2">
                <div className="w-8"></div> {/* Space for day labels */}
                <div className="flex-1 flex">
                  {monthLabels.map((month, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-600 font-medium"
                      style={{ 
                        marginLeft: index === 0 ? '0' : `${(month.startIndex / 7) * 12}px`,
                        minWidth: '30px'
                      }}
                    >
                      {month.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex">
                {/* Day labels */}
                <div className="w-8 flex flex-col justify-between text-xs text-gray-600 mr-2">
                  {dayLabels.map((day, index) => (
                    <div key={day} className="h-3 flex items-center">
                      {index % 2 === 1 ? day : ''}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const item = week.find(item => {
                          const date = new Date(item.date)
                          return date.getDay() === dayIndex
                        })
                        
                        return (
                          <div
                            key={dayIndex}
                            className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-300 ${
                              item ? getIntensityColor(item.intensity) : 'bg-gray-100 dark:bg-gray-800'
                            }`}
                            onMouseEnter={(e) => item && handleCellHover(item, e)}
                            onMouseLeave={handleCellLeave}
                            title={item ? `${formatDate(item.date)}: ${item.count} workout${item.count !== 1 ? 's' : ''}` : ''}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(intensity => (
                    <div
                      key={intensity}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 30,
          }}
        >
          <div className="font-medium">{formatDate(hoveredCell.date)}</div>
          <div>
            {hoveredCell.count} workout{hoveredCell.count !== 1 ? 's' : ''}
            {hoveredCell.totalSets > 0 && ` • ${hoveredCell.totalSets} sets`}
          </div>
        </div>
      )}
    </>
  )
}
