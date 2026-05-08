"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"

interface DaySchedule {
  id: string
  dayOfWeek: number
  name: string
  exercises: {
    id: string
    exerciseId: string
    exercise: { id: string; name: string; muscleGroup: string; equipment: string }
    order: number
  }[]
}

interface DayNavigationProps {
  selectedDay: number
  onDaySelect: (dayOfWeek: number) => void
  weeklySchedule?: DaySchedule[]
  loading?: boolean
  className?: string
}

const DAYS = [
  { value: 0, short: "Sun" },
  { value: 1, short: "Mon" },
  { value: 2, short: "Tue" },
  { value: 3, short: "Wed" },
  { value: 4, short: "Thu" },
  { value: 5, short: "Fri" },
  { value: 6, short: "Sat" },
]

export function DayNavigation({
  selectedDay,
  onDaySelect,
  weeklySchedule = [],
  loading = false,
  className,
}: DayNavigationProps) {
  const today = new Date().getDay()
  const scrollRef = useRef<HTMLDivElement>(null)

  const getDaySchedule = (d: number) => weeklySchedule.find(s => s.dayOfWeek === d)
  const getExerciseCount = (d: number) => getDaySchedule(d)?.exercises?.length ?? 0
  const getWorkoutName = (d: number) => {
    const name = getDaySchedule(d)?.name
    if (!name) return null
    // Shorten common suffixes for display
    return name.replace(" Day", "").replace(" Workout", "")
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Scrollable day strip */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {DAYS.map(({ value, short }) => {
          const isToday = value === today
          const isSelected = value === selectedDay
          const count = getExerciseCount(value)
          const name = getWorkoutName(value)

          return (
            <button
              key={value}
              onClick={() => !loading && onDaySelect(value)}
              disabled={loading}
              className={cn(
                "snap-center flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all duration-200 touch-manipulation min-w-[72px]",
                isSelected
                  ? "text-white shadow-lg scale-105"
                  : "hover:scale-102",
              )}
              style={
                isSelected
                  ? { background: "var(--primary)", boxShadow: "0 4px 20px oklch(0.62 0.19 244 / 40%)" }
                  : isToday
                  ? { background: "oklch(0.62 0.19 244 / 12%)", border: "1.5px solid oklch(0.62 0.19 244 / 40%)" }
                  : { background: "var(--card)", border: "1px solid var(--border)" }
              }
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: isSelected ? "rgba(255,255,255,0.75)" : "var(--muted-foreground)" }}
              >
                {isToday && !isSelected ? "TODAY" : short}
              </span>
              <span
                className="text-lg font-bold leading-none"
                style={{ color: isSelected ? "#fff" : "var(--foreground)" }}
              >
                {value}
              </span>
              {name ? (
                <span
                  className="text-[10px] font-medium truncate max-w-[64px] text-center leading-tight"
                  style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)" }}
                >
                  {name}
                </span>
              ) : (
                <span className="text-[10px]" style={{ color: isSelected ? "rgba(255,255,255,0.5)" : "var(--muted-foreground)" }}>
                  Rest
                </span>
              )}
              {count > 0 && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={
                    isSelected
                      ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                      : { background: "var(--primary)", color: "#fff" }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Today chip — only shown when not on today */}
      {selectedDay !== today && (
        <div className="flex justify-center">
          <button
            onClick={() => onDaySelect(today)}
            className="text-xs font-medium px-3 py-1 rounded-full transition-colors touch-manipulation"
            style={{ background: "var(--muted)", color: "var(--primary)" }}
          >
            ← Back to Today
          </button>
        </div>
      )}
    </div>
  )
}
