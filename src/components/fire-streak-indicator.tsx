"use client"

import { useState, useEffect } from "react"
import { Flame, TrendingUp, Target, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  thisWeekWorkouts: number
}

interface FireStreakIndicatorProps {
  className?: string
}

function getStreakColor(n: number) {
  if (n === 0) return "text-muted-foreground"
  if (n < 3) return "text-orange-400"
  if (n < 7) return "text-orange-500"
  if (n < 14) return "text-red-400"
  if (n < 30) return "text-red-500"
  return "text-red-600"
}

function getStreakGlow(n: number) {
  if (n === 0) return "none"
  if (n < 7) return "0 0 12px oklch(0.75 0.18 55 / 50%)"
  if (n < 14) return "0 0 16px oklch(0.65 0.22 30 / 60%)"
  return "0 0 24px oklch(0.6 0.25 25 / 70%)"
}

function getMessage(n: number) {
  if (n === 0) return "Start your streak today!"
  if (n < 3) return "Great start! Keep it going!"
  if (n < 7) return "Building momentum! 🔥"
  if (n < 14) return "You're on fire!"
  if (n < 30) return "Incredible dedication!"
  return "Legendary streak! 🏆"
}

export function FireStreakIndicator({ className }: FireStreakIndicatorProps) {
  const [data, setData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchStreak()
    const handler = () => fetchStreak()
    window.addEventListener("workoutSaved", handler)
    return () => window.removeEventListener("workoutSaved", handler)
  }, [])

  const fetchStreak = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/workout/streak")
      if (res.ok) setData(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-6" />
      </div>
    )
  }

  const streak = data?.currentStreak ?? 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation hover:scale-105 active:scale-95",
            className
          )}
          style={{ background: "var(--muted)" }}
        >
          <Flame
            className={cn("h-5 w-5", getStreakColor(streak))}
            style={{ filter: getStreakGlow(streak) !== "none" ? `drop-shadow(${getStreakGlow(streak)})` : undefined }}
          />
          <span className={cn("font-bold text-sm tabular-nums", getStreakColor(streak))}>
            {streak}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden border" style={{ borderColor: "var(--border)" }}>
        {/* Header gradient */}
        <div
          className="px-6 pt-6 pb-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, oklch(0.22 0.05 258) 0%, oklch(0.18 0.04 270) 100%)" }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(circle at 80% 20%, oklch(0.75 0.18 55) 0%, transparent 60%)" }} />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Flame className={cn("h-6 w-6", getStreakColor(streak))}
                style={{ filter: `drop-shadow(${getStreakGlow(streak)})` }} />
              Workout Streak
            </DialogTitle>
          </DialogHeader>

          <div className="relative flex flex-col items-center mt-4">
            <div className="flex items-end gap-2">
              <span className={cn("text-7xl font-black tabular-nums", getStreakColor(streak))}
                style={{ textShadow: getStreakGlow(streak) }}>
                {streak}
              </span>
              <span className="text-white/60 text-lg mb-3 font-medium">days</span>
            </div>
            <p className="text-white/80 text-sm font-medium">{getMessage(streak)}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 space-y-3" style={{ background: "var(--card)" }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, label: "Best", value: data?.longestStreak ?? 0, unit: "days", color: "text-emerald-400", bg: "oklch(0.75 0.17 140 / 12%)" },
              { icon: Target, label: "Total", value: data?.totalWorkouts ?? 0, unit: "sessions", color: "text-primary", bg: "oklch(0.62 0.19 244 / 12%)" },
              { icon: Calendar, label: "This week", value: data?.thisWeekWorkouts ?? 0, unit: "/ 7", color: "text-violet-400", bg: "oklch(0.65 0.2 290 / 12%)" },
            ].map(({ icon: Icon, label, value, unit, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
                <p className={cn("text-2xl font-black tabular-nums", color)}>{value}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--muted-foreground)" }}>{unit}</p>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Week bar */}
          <div className="rounded-xl p-3" style={{ background: "var(--muted)" }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold">This week</span>
              <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>
                {data?.thisWeekWorkouts ?? 0}/7
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-2 rounded-full transition-all"
                  style={{
                    background: i < (data?.thisWeekWorkouts ?? 0)
                      ? "var(--primary)"
                      : "oklch(1 0 0 / 10%)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useStreakRefresh() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const refreshStreak = () => setRefreshTrigger(p => p + 1)
  return { refreshStreak, refreshTrigger }
}
