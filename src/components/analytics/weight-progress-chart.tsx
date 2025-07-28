"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { format, parseISO } from "date-fns"

interface WeightProgressData {
  [exerciseName: string]: Array<{
    date: string
    weight: number
    exerciseId: string
  }>
}

interface WeightProgressChartProps {
  data: WeightProgressData
  className?: string
}

const colors = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
]

export function WeightProgressChart({ data, className }: WeightProgressChartProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>("all")
  const [showAll, setShowAll] = useState(false)

  const exerciseNames = Object.keys(data).sort()
  const displayExercises = showAll ? exerciseNames : exerciseNames.slice(0, 5)

  // Prepare chart data
  const chartData = prepareChartData(data, displayExercises)

  // Calculate trends for selected exercise
  const selectedTrend = selectedExercise && selectedExercise !== "all" && data[selectedExercise]
    ? calculateTrend(data[selectedExercise])
    : null

  return (
    <Card className={`mobile-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weight Progress
            </CardTitle>
            <CardDescription>
              Track your strength gains over time
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedTrend && (
              <Badge variant={selectedTrend.direction === 'up' ? 'default' : 
                             selectedTrend.direction === 'down' ? 'destructive' : 'secondary'}>
                {selectedTrend.direction === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                {selectedTrend.direction === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                {selectedTrend.direction === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                {selectedTrend.change > 0 ? '+' : ''}{selectedTrend.change}kg
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="mobile-input w-full sm:w-[200px]">
              <SelectValue placeholder="Focus on exercise..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All exercises</SelectItem>
              {exerciseNames.map(name => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {exerciseNames.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
            >
              {showAll ? 'Show less' : `Show all ${exerciseNames.length}`}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                className="text-xs"
              />
              <YAxis 
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              <Tooltip 
                labelFormatter={(value) => format(parseISO(value as string), 'MMM dd, yyyy')}
                formatter={(value: number, name: string) => [`${value}kg`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              
              {displayExercises.map((exerciseName, index) => {
                if (selectedExercise && selectedExercise !== "all" && selectedExercise !== exerciseName) return null
                
                return (
                  <Line
                    key={exerciseName}
                    type="monotone"
                    dataKey={exerciseName}
                    stroke={colors[index % colors.length]}
                    strokeWidth={selectedExercise === exerciseName || selectedExercise === "all" ? 3 : 2}
                    dot={{ r: selectedExercise === exerciseName || selectedExercise === "all" ? 6 : 4 }}
                    activeDot={{ r: 8 }}
                    connectNulls={false}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {chartData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No weight progress data available</p>
            <p className="text-sm">Complete workouts with weights to see your progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function prepareChartData(data: WeightProgressData, exerciseNames: string[]) {
  const allDates = new Set<string>()
  
  // Collect all unique dates
  exerciseNames.forEach(exerciseName => {
    if (data[exerciseName]) {
      data[exerciseName].forEach(point => allDates.add(point.date))
    }
  })

  // Sort dates
  const sortedDates = Array.from(allDates).sort()

  // Create chart data
  return sortedDates.map(date => {
    const dataPoint: { [key: string]: string | number | null } = { date }
    
    exerciseNames.forEach(exerciseName => {
      if (data[exerciseName]) {
        const point = data[exerciseName].find(p => p.date === date)
        dataPoint[exerciseName] = point ? point.weight : null
      }
    })
    
    return dataPoint
  })
}

function calculateTrend(exerciseData: Array<{ date: string; weight: number }>) {
  if (exerciseData.length < 2) return null

  const sortedData = [...exerciseData].sort((a, b) => a.date.localeCompare(b.date))
  const firstWeight = sortedData[0].weight
  const lastWeight = sortedData[sortedData.length - 1].weight
  const change = Math.round((lastWeight - firstWeight) * 10) / 10

  let direction: 'up' | 'down' | 'stable'
  if (Math.abs(change) < 0.5) {
    direction = 'stable'
  } else if (change > 0) {
    direction = 'up'
  } else {
    direction = 'down'
  }

  return { change, direction }
}
