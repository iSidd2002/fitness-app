"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { Loader2, BarChart3, RefreshCw, Filter } from "lucide-react"
import { WeightProgressChart } from "./weight-progress-chart"
import { VolumeTrendsChart } from "./volume-trends-chart"
import { MuscleGroupChart } from "./muscle-group-chart"
import { FrequencyTrendsChart } from "./frequency-trends-chart"
import { PersonalRecordsChart } from "./personal-records-chart"
import { subDays, format } from "date-fns"
import { DateRange } from "react-day-picker"

interface AnalyticsData {
  weightProgress: { [exerciseName: string]: Array<{ date: string; weight: number; exerciseId: string }> }
  volumeTrends: Array<{ week: string; volume: number }>
  muscleGroupDistribution: Array<{ name: string; value: number; percentage: number }>
  frequencyTrends: Array<{ day: string; count: number }>
  personalRecords: Array<{
    exerciseName: string
    weight: number
    reps: number
    oneRepMax: number
    date: string
    exerciseId: string
  }>
  summary: {
    totalWorkouts: number
    totalSets: number
    totalVolume: number
    uniqueExercises: number
    averageWorkoutsPerWeek: number
  }
}

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date()
  })
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all")
  const [selectedExercise, setSelectedExercise] = useState<string>("all")

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (dateRange?.from) params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'))
      if (dateRange?.to) params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'))
      if (selectedMuscleGroup && selectedMuscleGroup !== 'all') params.append('muscleGroup', selectedMuscleGroup)
      if (selectedExercise && selectedExercise !== 'all') params.append('exerciseId', selectedExercise)

      const response = await fetch(`/api/analytics?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, selectedMuscleGroup, selectedExercise])

  // Get available muscle groups and exercises from data
  const availableMuscleGroups = data?.muscleGroupDistribution.map(mg => mg.name) || []
  const availableExercises = data ? Object.keys(data.weightProgress) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="mobile-card">
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading analytics: {error}</p>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="mobile-card">
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <Card className="mobile-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Muscle Group</label>
              <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                <SelectTrigger className="mobile-input">
                  <SelectValue placeholder="All muscle groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All muscle groups</SelectItem>
                  {availableMuscleGroups.map(mg => (
                    <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Exercise</label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="mobile-input">
                  <SelectValue placeholder="All exercises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All exercises</SelectItem>
                  {availableExercises.map(ex => (
                    <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchAnalytics} variant="outline" className="mobile-button w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="mobile-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalWorkouts}</div>
            <div className="text-xs text-gray-500">Total Workouts</div>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{data.summary.totalSets}</div>
            <div className="text-xs text-gray-500">Total Sets</div>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.summary.totalVolume.toLocaleString()}kg
            </div>
            <div className="text-xs text-gray-500">Total Volume</div>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{data.summary.uniqueExercises}</div>
            <div className="text-xs text-gray-500">Unique Exercises</div>
          </CardContent>
        </Card>
        <Card className="mobile-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{data.summary.averageWorkoutsPerWeek}</div>
            <div className="text-xs text-gray-500">Avg/Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeightProgressChart data={data.weightProgress} />
        <VolumeTrendsChart data={data.volumeTrends} />
        <MuscleGroupChart data={data.muscleGroupDistribution} />
        <FrequencyTrendsChart data={data.frequencyTrends} />
      </div>

      {/* Personal Records - Full Width */}
      <PersonalRecordsChart data={data.personalRecords} />
    </div>
  )
}
