"use client"

export const dynamic = 'force-dynamic'

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkoutHeatmap } from "@/components/workout-heatmap"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { AuthGuard } from "@/components/auth-guard"
import { TrendingUp } from "lucide-react"
import Link from "next/link"

function DashboardContent() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Progress</h2>
          <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
            {session?.user.name}&apos;s analytics &amp; overview
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Workout</CardTitle>
              <CardDescription>Start your daily workout routine</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/">Start Workout</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
              <CardDescription>View your past workout sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/history">View History</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>Compare your progress with others</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/leaderboard">View Rankings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Workout Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of your training progress and patterns
              </CardDescription>
            </CardHeader>
          </Card>
          <AnalyticsDashboard className="mt-6" />
        </div>

        <div className="mt-8">
          <WorkoutHeatmap />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
