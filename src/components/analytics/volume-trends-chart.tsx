"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react"
import { format, parseISO, startOfWeek } from "date-fns"

interface VolumeTrendsData {
  week: string
  volume: number
}

interface VolumeTrendsChartProps {
  data: VolumeTrendsData[]
  className?: string
}

export function VolumeTrendsChart({ data, className }: VolumeTrendsChartProps) {
  // Calculate trend
  const trend = calculateVolumeTrend(data)
  
  // Format data for display
  const chartData = data.map(item => ({
    ...item,
    weekLabel: format(parseISO(item.week), 'MMM dd'),
    formattedVolume: formatVolume(item.volume)
  }))

  return (
    <Card className={`mobile-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Volume Trends
            </CardTitle>
            <CardDescription>
              Total training volume (weight × reps × sets) per week
            </CardDescription>
          </div>
          
          {trend && (
            <Badge variant={trend.direction === 'up' ? 'default' : 
                           trend.direction === 'down' ? 'destructive' : 'secondary'}>
              {trend.direction === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend.direction === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="weekLabel" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                tickFormatter={formatVolume}
              />
              <Tooltip 
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    const weekStart = parseISO(payload[0].payload.week)
                    return `Week of ${format(weekStart, 'MMM dd, yyyy')}`
                  }
                  return value
                }}
                formatter={(value: number) => [formatVolume(value), 'Volume']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              
              <Bar 
                dataKey="volume" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No volume data available</p>
            <p className="text-sm">Complete workouts to see your weekly volume trends</p>
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatVolume(Math.max(...data.map(d => d.volume)))}
              </div>
              <div className="text-xs text-gray-500">Peak Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatVolume(data.reduce((sum, d) => sum + d.volume, 0) / data.length)}
              </div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {formatVolume(data[data.length - 1]?.volume || 0)}
              </div>
              <div className="text-xs text-gray-500">This Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {formatVolume(data.reduce((sum, d) => sum + d.volume, 0))}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function calculateVolumeTrend(data: VolumeTrendsData[]) {
  if (data.length < 2) return null

  const sortedData = [...data].sort((a, b) => a.week.localeCompare(b.week))
  
  // Compare last 2 weeks vs previous 2 weeks (or available data)
  const recentWeeks = sortedData.slice(-2)
  const previousWeeks = sortedData.slice(-4, -2)
  
  if (recentWeeks.length === 0) return null

  const recentAvg = recentWeeks.reduce((sum, d) => sum + d.volume, 0) / recentWeeks.length
  const previousAvg = previousWeeks.length > 0 
    ? previousWeeks.reduce((sum, d) => sum + d.volume, 0) / previousWeeks.length
    : recentAvg

  const change = recentAvg - previousAvg
  const percentage = previousAvg > 0 ? Math.round((change / previousAvg) * 100) : 0

  let direction: 'up' | 'down' | 'stable'
  if (Math.abs(percentage) < 5) {
    direction = 'stable'
  } else if (percentage > 0) {
    direction = 'up'
  } else {
    direction = 'down'
  }

  return { percentage, direction }
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`
  } else {
    return volume.toString()
  }
}
