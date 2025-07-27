"use client"

export const dynamic = 'force-dynamic'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkoutHeatmap } from "@/components/workout-heatmap"
import { FireStreakIndicator } from "@/components/fire-streak-indicator"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (status === "loading") return // Still loading
    if (!session) router.push("/login") // Not authenticated
  }, [session, status, router, mounted])

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

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

              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-xs text-gray-500">Workout Analytics & Progress</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FireStreakIndicator />
              <span className="hidden sm:inline text-sm text-gray-600">
                {session?.user?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-container max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Fitness Overview
          </h2>
          <p className="text-gray-600">
            Track your progress and maintain your workout streak, {session.user.name}!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Workout</CardTitle>
              <CardDescription>
                Start your daily workout routine
              </CardDescription>
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
              <CardDescription>
                View your past workout sessions
              </CardDescription>
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
              <CardDescription>
                Compare your progress with others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/leaderboard">View Rankings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Workout Activity Heatmap */}
        <div className="mt-8">
          <WorkoutHeatmap />
        </div>
      </div>
    </div>
  )
}
