"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, Award, TrendingUp, Users, Weight } from "lucide-react"
import { toast } from "sonner"

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  maxWeight: number
  maxWeightReps: number
  estimatedOneRepMax: number
  bestOneRepMaxWeight: number
  bestOneRepMaxReps: number
  totalSets: number
}

interface ExerciseLeaderboard {
  exerciseName: string
  leaderboard: LeaderboardEntry[]
  totalParticipants: number
}

interface TopExercise {
  exerciseName: string
  participantCount: number
  totalSets: number
  maxWeightRecorded: number
}

export function ExerciseWeightLeaderboard() {
  const [selectedExercise, setSelectedExercise] = useState<string>("")
  const [exerciseLeaderboard, setExerciseLeaderboard] = useState<ExerciseLeaderboard | null>(null)
  const [topExercises, setTopExercises] = useState<TopExercise[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch top exercises on component mount
  useEffect(() => {
    fetchTopExercises()
  }, [])

  const fetchTopExercises = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/leaderboard/exercise-weights')
      if (!response.ok) throw new Error('Failed to fetch top exercises')
      
      const data = await response.json()
      setTopExercises(data.topExercises || [])
    } catch (error) {
      console.error('Error fetching top exercises:', error)
      toast.error('Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }

  const fetchExerciseLeaderboard = async (exerciseName: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leaderboard/exercise-weights?exercise=${encodeURIComponent(exerciseName)}`)
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      
      const data = await response.json()
      setExerciseLeaderboard(data)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleExerciseSelect = (exerciseName: string) => {
    setSelectedExercise(exerciseName)
    fetchExerciseLeaderboard(exerciseName)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Award className="h-5 w-5 text-amber-600" />
      default: return <span className="h-5 w-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-500 text-white"
      case 2: return "bg-gray-400 text-white"
      case 3: return "bg-amber-600 text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Weight className="h-8 w-8" />
          Exercise Weight Leaderboards
        </h1>
        <p className="text-muted-foreground">
          Compete with others and track your personal records
        </p>
      </div>

      {/* Exercise Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Select Exercise
          </CardTitle>
          <CardDescription>
            Choose an exercise to view its weight leaderboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedExercise} onValueChange={handleExerciseSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select an exercise..." />
            </SelectTrigger>
            <SelectContent>
              {topExercises.map((exercise) => (
                <SelectItem key={exercise.exerciseName} value={exercise.exerciseName}>
                  <div className="flex items-center justify-between w-full">
                    <span>{exercise.exerciseName}</span>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {exercise.participantCount}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {exercise.maxWeightRecorded}kg max
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Top Exercises Overview */}
      {!selectedExercise && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Popular Exercises
            </CardTitle>
            <CardDescription>
              Most tracked exercises with competitive leaderboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topExercises.map((exercise) => (
                <Card key={exercise.exerciseName} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExerciseSelect(exercise.exerciseName)}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{exercise.exerciseName}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {exercise.participantCount} participants
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4" />
                        {exercise.maxWeightRecorded}kg record
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {exercise.totalSets} total sets
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Leaderboard */}
      {exerciseLeaderboard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {exerciseLeaderboard.exerciseName} Leaderboard
            </CardTitle>
            <CardDescription>
              Ranked by estimated 1RM • {exerciseLeaderboard.totalParticipants} participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exerciseLeaderboard.leaderboard.map((entry) => (
                <div key={entry.userId} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    {getRankIcon(entry.rank)}
                    <Badge className={getRankBadgeColor(entry.rank)}>
                      #{entry.rank}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{entry.userName}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">{entry.estimatedOneRepMax}kg</span>
                        <br />Est. 1RM
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{entry.maxWeight}kg</span>
                        <br />Max Weight
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{entry.maxWeightReps}</span>
                        <br />@ Max Weight
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{entry.totalSets}</span>
                        <br />Total Sets
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {exerciseLeaderboard.leaderboard.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No data available for this exercise yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      )}
    </div>
  )
}
