"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"
import { format, parseISO } from "date-fns"

interface PersonalRecord {
  exerciseName: string
  weight: number
  reps: number
  oneRepMax: number
  date: string
  exerciseId: string
}

interface PersonalRecordsChartProps {
  data: PersonalRecord[]
  className?: string
}

export function PersonalRecordsChart({ data, className }: PersonalRecordsChartProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Sort by one rep max descending
  const sortedRecords = [...data].sort((a, b) => b.oneRepMax - a.oneRepMax)
  const displayRecords = showAll ? sortedRecords : sortedRecords.slice(0, 6)

  // Get medal icons for top 3
  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-4 w-4 text-yellow-500" />
      case 1: return <Medal className="h-4 w-4 text-gray-400" />
      case 2: return <Award className="h-4 w-4 text-amber-600" />
      default: return null
    }
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-50 border-yellow-200'
      case 1: return 'bg-gray-50 border-gray-200'
      case 2: return 'bg-amber-50 border-amber-200'
      default: return 'bg-white border-gray-200'
    }
  }

  return (
    <Card className={`mobile-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Personal Records
            </CardTitle>
            <CardDescription>
              Your strongest lifts and estimated 1RM
            </CardDescription>
          </div>
          
          {data.length > 0 && (
            <Badge variant="default" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {data.length} PRs
            </Badge>
          )}
        </div>

        {data.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-fit"
          >
            {showAll ? 'Show top 6' : `Show all ${data.length} records`}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No personal records yet</p>
            <p className="text-sm">Complete workouts with weights to set your first PR</p>
          </div>
        )}

        {data.length > 0 && (
          <div className="space-y-3">
            {displayRecords.map((record, index) => (
              <div 
                key={`${record.exerciseId}-${record.date}`}
                className={`p-4 rounded-lg border ${getMedalColor(index)} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMedalIcon(index)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {record.exerciseName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {record.weight}kg × {record.reps} reps
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {record.oneRepMax}kg
                    </div>
                    <div className="text-xs text-gray-500">
                      Est. 1RM
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1} Strongest
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(parseISO(record.date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {sortedRecords[0]?.oneRepMax || 0}kg
              </div>
              <div className="text-xs text-gray-500">Strongest Lift</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(data.reduce((sum, r) => sum + r.oneRepMax, 0) / data.length)}kg
              </div>
              <div className="text-xs text-gray-500">Average 1RM</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {data.length}
              </div>
              <div className="text-xs text-gray-500">Total PRs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(data.map(r => r.exerciseName)).size}
              </div>
              <div className="text-xs text-gray-500">Exercises</div>
            </div>
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Strength Insights</span>
            </div>
            <div className="text-sm text-green-800 space-y-1">
              <p>Your strongest lift: <strong>{sortedRecords[0]?.exerciseName}</strong> ({sortedRecords[0]?.oneRepMax}kg)</p>
              {sortedRecords.length > 1 && (
                <p>Total estimated strength: <strong>{Math.round(data.reduce((sum, r) => sum + r.oneRepMax, 0))}kg</strong></p>
              )}
              <p className="text-gray-600">
                Keep pushing your limits to set new personal records!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
