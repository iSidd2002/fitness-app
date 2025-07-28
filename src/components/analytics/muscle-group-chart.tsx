"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp } from "lucide-react"

interface MuscleGroupData {
  name: string
  value: number
  percentage: number
}

interface MuscleGroupChartProps {
  data: MuscleGroupData[]
  className?: string
}

const MUSCLE_GROUP_COLORS: { [key: string]: string } = {
  'Chest': '#8884d8',
  'Back': '#82ca9d',
  'Shoulders': '#ffc658',
  'Arms': '#ff7300',
  'Legs': '#00ff00',
  'Core': '#ff00ff',
  'Cardio': '#00ffff',
  'Full Body': '#ff0000',
  'Other': '#888888'
}

const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
]

export function MuscleGroupChart({ data, className }: MuscleGroupChartProps) {
  // Sort data by value for better visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  
  // Get colors for each muscle group
  const dataWithColors = sortedData.map((item, index) => ({
    ...item,
    color: MUSCLE_GROUP_COLORS[item.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }))

  // Find most and least trained muscle groups
  const mostTrained = sortedData[0]
  const leastTrained = sortedData[sortedData.length - 1]
  const isBalanced = mostTrained && leastTrained && 
    (mostTrained.percentage - leastTrained.percentage) < 20

  return (
    <Card className={`mobile-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Muscle Group Distribution
            </CardTitle>
            <CardDescription>
              Balance of training across muscle groups
            </CardDescription>
          </div>
          
          <Badge variant={isBalanced ? 'default' : 'secondary'}>
            {isBalanced ? 'Balanced' : 'Imbalanced'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithColors}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [`${value} sets`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No muscle group data available</p>
            <p className="text-sm">Complete workouts to see your training distribution</p>
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedData.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dataWithColors[index]?.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.value} sets</span>
                    <Badge variant="outline" className="text-xs">
                      {item.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {mostTrained && leastTrained && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Training Insights</span>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Most trained: <strong>{mostTrained.name}</strong> ({mostTrained.percentage}%)</p>
                  <p>Least trained: <strong>{leastTrained.name}</strong> ({leastTrained.percentage}%)</p>
                  {!isBalanced && (
                    <p className="text-orange-600">
                      Consider adding more {leastTrained.name} exercises for better balance
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
