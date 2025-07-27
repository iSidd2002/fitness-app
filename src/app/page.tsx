"use client"

import { DailyWorkoutDashboard } from "@/components/daily-workout-dashboard"
import { AuthGuard } from "@/components/auth-guard"

export default function Home() {
  return (
    <AuthGuard>
      <DailyWorkoutDashboard />
    </AuthGuard>
  )
}
