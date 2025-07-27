"use client"

export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { FlexibleWorkoutDashboard } from "@/components/flexible-workout-dashboard"
import { AuthGuard } from "@/components/auth-guard"

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuard>
        <FlexibleWorkoutDashboard />
      </AuthGuard>
    </Suspense>
  )
}
