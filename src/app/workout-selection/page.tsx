"use client"

export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { WorkoutDashboard } from "@/components/workout-dashboard"
import { AuthGuard } from "@/components/auth-guard"

export default function WorkoutSelectionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuard>
        <WorkoutDashboard />
      </AuthGuard>
    </Suspense>
  )
}
