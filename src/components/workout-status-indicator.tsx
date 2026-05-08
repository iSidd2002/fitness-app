"use client"

import { Play, CheckCircle, Dumbbell, Zap } from "lucide-react"

interface WorkoutStatusIndicatorProps {
  status: "not_started" | "in_progress" | "completed"
  onStartWorkout?: () => void
  workoutName?: string
  exerciseCount?: number
  completedSets?: number
  totalSets?: number
  disabled?: boolean
  className?: string
}

export function WorkoutStatusIndicator({
  status,
  onStartWorkout,
  workoutName,
  exerciseCount = 0,
  completedSets = 0,
  totalSets = 0,
  disabled = false,
  className = "",
}: WorkoutStatusIndicatorProps) {
  const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  // ── Not started with exercises ──────────────────────────────────────────────
  if (status === "not_started" && exerciseCount > 0) {
    return (
      <button
        onClick={onStartWorkout}
        disabled={disabled}
        className={`w-full group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] disabled:opacity-50 touch-manipulation ${className}`}
        style={{
          background: "linear-gradient(135deg, oklch(0.62 0.19 244) 0%, oklch(0.55 0.22 270) 100%)",
          boxShadow: "0 8px 32px oklch(0.62 0.19 244 / 35%)",
        }}
      >
        {/* shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)" }} />

        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight">
              {workoutName ? `Start ${workoutName}` : "Start Workout"}
            </p>
            <p className="text-white/70 text-sm mt-0.5">
              {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""} · Tap to begin
            </p>
          </div>
          <Zap className="h-5 w-5 text-white/60 flex-shrink-0" />
        </div>
      </button>
    )
  }

  // ── No exercises ────────────────────────────────────────────────────────────
  if (status === "not_started" && exerciseCount === 0) {
    return (
      <div
        className={`rounded-2xl border-2 border-dashed p-6 text-center ${className}`}
        style={{ borderColor: "var(--border)" }}
      >
        <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: "var(--muted-foreground)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
          No exercises scheduled
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          Add exercises below to get started
        </p>
      </div>
    )
  }

  // ── Completed ───────────────────────────────────────────────────────────────
  if (status === "completed") {
    return (
      <div
        className={`rounded-2xl p-4 flex items-center gap-3 ${className}`}
        style={{ background: "oklch(0.75 0.17 140 / 12%)", border: "1px solid oklch(0.75 0.17 140 / 30%)" }}
      >
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(0.75 0.17 140 / 20%)" }}>
          <CheckCircle className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-emerald-400">Workout Complete 🎉</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Great work! Check history for details.
          </p>
        </div>
      </div>
    )
  }

  // ── In progress ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(0.62 0.19 244 / 15%)" }}>
          <Dumbbell className="h-5 w-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">In Progress</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: "oklch(0.62 0.19 244 / 20%)", color: "var(--primary)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-current inline-block" />
              ACTIVE
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {workoutName} · {completedSets}/{totalSets} sets
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black" style={{ color: "var(--primary)" }}>{pct}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--primary), oklch(0.55 0.22 270))",
          }}
        />
      </div>
    </div>
  )
}
