import { ExerciseWeightLeaderboard } from "@/components/exercise-weight-leaderboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="mobile-header flex items-center justify-between min-h-[56px] sm:h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workout
                </Link>
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <ExerciseWeightLeaderboard />
      </div>
    </div>
  )
}
