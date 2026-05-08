import { ExerciseWeightLeaderboard } from "@/components/exercise-weight-leaderboard"
import { Trophy } from "lucide-react"

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>
        <ExerciseWeightLeaderboard />
      </div>
    </div>
  )
}
