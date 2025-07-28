"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Star } from "lucide-react"

interface FrequencyTrendsData {
  day: string
  count: number
}

interface FrequencyTrendsChartProps {
  data: FrequencyTrendsData[]
  className?: string
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function FrequencyTrendsChart({ data, className }: FrequencyTrendsChartProps) {
  // Sort data by day order
  const sortedData = DAY_ORDER.map(day => 
    data.find(item => item.day === day) || { day, count: 0 }
  )

  // Find best and worst days
  const bestDay = data.reduce((max, item) => item.count > max.count ? item : max, data[0] || { day: '', count: 0 })
  const totalWorkouts = data.reduce((sum, item) => sum + item.count, 0)
  const averagePerDay = totalWorkouts / 7

  return (
    <Card className={`mobile-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Workout Frequency by Day
            </CardTitle>
            <CardDescription>
              Which days you train most often
            </CardDescription>
          </div>
          
          {bestDay.count > 0 && (
            <Badge variant="default" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {bestDay.day}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                tickFormatter={(value) => value.slice(0, 3)} // Show first 3 letters
              />
              <YAxis 
                label={{ value: 'Workouts', angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              <Tooltip 
                formatter={(value: number) => [`${value} workouts`, 'Count']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              
              <Bar 
                dataKey="count" 
                fill="#82ca9d"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {totalWorkouts === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No workout frequency data available</p>
            <p className="text-sm">Complete workouts to see your training patterns</p>
          </div>
        )}

        {totalWorkouts > 0 && (
          <div className="mt-4 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {bestDay.count}
                </div>
                <div className="text-xs text-gray-500">Most Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(averagePerDay * 10) / 10}
                </div>
                <div className="text-xs text-gray-500">Daily Average</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalWorkouts}
                </div>
                <div className="text-xs text-gray-500">Total Workouts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {data.filter(d => d.count > 0).length}
                </div>
                <div className="text-xs text-gray-500">Active Days</div>
              </div>
            </div>

            {/* Day Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sortedData.map((item) => {
                const percentage = totalWorkouts > 0 ? Math.round((item.count / totalWorkouts) * 100) : 0
                const isWeekend = item.day === 'Saturday' || item.day === 'Sunday'
                const isBestDay = item.day === bestDay.day
                
                return (
                  <div 
                    key={item.day} 
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isBestDay ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isWeekend ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {item.day}
                      </span>
                      {isBestDay && <Star className="h-3 w-3 text-green-600" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{item.count} workouts</span>
                      <Badge variant="outline" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Insights */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Training Insights</span>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Your most active day is <strong>{bestDay.day}</strong> with {bestDay.count} workouts</p>
                {averagePerDay < 1 && (
                  <p className="text-orange-600">
                    Consider increasing workout frequency for better consistency
                  </p>
                )}
                {data.filter(d => d.count === 0).length > 0 && (
                  <p className="text-gray-600">
                    Try scheduling workouts on your rest days: {data.filter(d => d.count === 0).map(d => d.day).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
