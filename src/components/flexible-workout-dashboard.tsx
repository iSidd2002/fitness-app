"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Plus, Save, Trash2, Settings, RefreshCw, Play, ExternalLink,
  ArrowLeftRight, X, ClipboardCopy, Minus, Dumbbell, Trophy,
  ChevronDown, ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AddCustomExerciseDialog } from "@/components/add-custom-exercise-dialog"
import { ExerciseReplacementDialog } from "@/components/exercise-replacement-dialog"
import { DayNavigation } from "@/components/day-navigation"
import { DaySwapConfirmationDialog } from "@/components/day-swap-confirmation-dialog"
import { WorkoutStatusIndicator } from "@/components/workout-status-indicator"
import { WorkoutSummaryBar } from "@/components/workout-summary-bar"
import { FireStreakIndicator } from "@/components/fire-streak-indicator"
import { useAuthGuard } from "@/components/auth-guard"
import { calculatePlates, calculateEpley1RM, isPR, PLATE_COLORS } from "@/lib/workout-utils"

// ── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  id: string; name: string; description?: string
  muscleGroup: string; equipment: string; videoUrl?: string; userId?: string
}
interface ExerciseSet { id?: string; setNumber: number; reps: number; weightKg: number }
interface WorkoutExercise {
  id?: string; exerciseId: string; exercise: Exercise
  isCustom: boolean; order: number; sets: ExerciseSet[]
  originalExerciseId?: string; originalExerciseName?: string
}
interface DaySchedule {
  id: string; dayOfWeek: number; name: string
  exercises: { id: string; exerciseId: string; exercise: Exercise; order: number }[]
}
interface PersonalRecord { exerciseName: string; oneRepMax: number }

// ── Muscle group colour palette ───────────────────────────────────────────────

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#ef4444",
  Back: "#3b82f6",
  Legs: "#8b5cf6",
  Quads: "#8b5cf6",
  Hamstrings: "#a855f7",
  Glutes: "#d946ef",
  Shoulders: "#f59e0b",
  Arms: "#10b981",
  Biceps: "#10b981",
  Triceps: "#06b6d4",
  Core: "#ec4899",
  Abs: "#ec4899",
  Cardio: "#0ea5e9",
  Other: "#6b7280",
}

function getMuscleColor(muscleGroup: string) {
  for (const [key, color] of Object.entries(MUSCLE_COLORS)) {
    if (muscleGroup?.toLowerCase().includes(key.toLowerCase())) return color
  }
  return MUSCLE_COLORS.Other
}

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

// ── Main component ────────────────────────────────────────────────────────────

export function FlexibleWorkoutDashboard() {
  const { session } = useAuthGuard()
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([])
  const [currentDaySchedule, setCurrentDaySchedule] = useState<DaySchedule | null>(null)
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isReplacementDialogOpen, setIsReplacementDialogOpen] = useState(false)
  const [exerciseToReplace, setExerciseToReplace] = useState<{ index: number; exercise: Exercise } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dayLoading, setDayLoading] = useState(false)
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [showSwapDialog, setShowSwapDialog] = useState(false)
  const [swapLoading, setSwapLoading] = useState(false)
  const [showSwapBanner, setShowSwapBanner] = useState(true)
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])

  const today = new Date().getDay()

  const prMap = useMemo(() => {
    const m = new Map<string, number>()
    personalRecords.forEach(pr => m.set(pr.exerciseName, pr.oneRepMax))
    return m
  }, [personalRecords])

  const prExerciseNames = useMemo(() => {
    const s = new Set<string>()
    for (const ex of workoutExercises)
      for (const set of ex.sets)
        if (set.reps > 0 && set.weightKg > 0 && isPR(calculateEpley1RM(set.weightKg, set.reps), prMap.get(ex.exercise.name)))
          s.add(ex.exercise.name)
    return s
  }, [workoutExercises, prMap])

  const groupedExercises = useMemo(() => {
    const g: Record<string, { ex: WorkoutExercise; idx: number }[]> = {}
    workoutExercises.forEach((ex, idx) => {
      const group = ex.exercise.muscleGroup || "Other"
      ;(g[group] ??= []).push({ ex, idx })
    })
    return g
  }, [workoutExercises])

  useEffect(() => {
    fetchWeeklySchedule()
    fetchPersonalRecords()
    const dismissed = localStorage.getItem("swapInfoBannerDismissed")
    if (dismissed === "true") setShowSwapBanner(false)
    const handler = () => fetchPersonalRecords()
    window.addEventListener("workoutSaved", handler)
    return () => window.removeEventListener("workoutSaved", handler)
  }, [])

  useEffect(() => { fetchDaySchedule(selectedDay) }, [selectedDay])

  const fetchPersonalRecords = async () => {
    try {
      const res = await fetch("/api/analytics")
      if (res.ok) setPersonalRecords((await res.json()).personalRecords ?? [])
    } catch { /* non-critical */ }
  }

  const fetchWeeklySchedule = async () => {
    try {
      const res = await fetch("/api/schedule/weekly")
      if (res.ok) setWeeklySchedule((await res.json()).schedule ?? [])
    } catch { toast.error("Failed to load schedule") }
    finally { setLoading(false) }
  }

  const fetchDaySchedule = async (day: number) => {
    setDayLoading(true)
    try {
      const res = await fetch(`/api/schedule/day/${day}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentDaySchedule(data.schedule)
        setWorkoutExercises(
          data.schedule?.exercises?.map((ex: { exerciseId: string; exercise: Exercise; order: number }) => ({
            exerciseId: ex.exerciseId, exercise: ex.exercise,
            isCustom: false, order: ex.order,
            sets: [{ setNumber: 1, reps: 0, weightKg: 0 }],
          })) ?? []
        )
      }
    } catch { toast.error("Failed to load day schedule") }
    finally { setDayLoading(false) }
  }

  const handleAddSet = (i: number) =>
    setWorkoutExercises(prev => {
      const u = [...prev]
      u[i].sets.push({ setNumber: u[i].sets.length + 1, reps: 0, weightKg: 0 })
      return u
    })

  const handleRemoveSet = (ei: number, si: number) =>
    setWorkoutExercises(prev => {
      const u = [...prev]
      u[ei].sets.splice(si, 1)
      u[ei].sets.forEach((s, i) => { s.setNumber = i + 1 })
      return u
    })

  const handleSetChange = (ei: number, si: number, field: "reps" | "weightKg", val: number) =>
    setWorkoutExercises(prev => {
      const u = [...prev]
      u[ei].sets[si][field] = Math.max(0, val)
      return u
    })

  const handleRemoveExercise = (i: number) =>
    setWorkoutExercises(prev => prev.filter((_, idx) => idx !== i))

  const handleReplaceExercise = (i: number) => {
    setExerciseToReplace({ index: i, exercise: workoutExercises[i].exercise })
    setIsReplacementDialogOpen(true)
  }

  const handleExerciseReplaced = (newEx: Exercise) => {
    if (!exerciseToReplace) return
    setWorkoutExercises(prev => {
      const u = [...prev]
      const orig = u[exerciseToReplace.index].exercise
      u[exerciseToReplace.index] = {
        ...u[exerciseToReplace.index],
        exercise: newEx, exerciseId: newEx.id,
        isCustom: !!newEx.userId,
        originalExerciseId: orig.id, originalExerciseName: orig.name,
      }
      return u
    })
    setExerciseToReplace(null)
    setIsReplacementDialogOpen(false)
  }

  const handleAddCustomExercise = (ex: Exercise) => {
    setWorkoutExercises(prev => [...prev, {
      exerciseId: ex.id, exercise: ex, isCustom: true,
      order: prev.length + 1, sets: [{ setNumber: 1, reps: 0, weightKg: 0 }],
    }])
    setIsAddDialogOpen(false)
  }

  const handleCopyLastSession = async (exerciseId: string, exerciseName: string, idx: number) => {
    try {
      const res = await fetch("/api/workout/history")
      if (!res.ok) throw new Error()
      const { workoutLogs } = await res.json()
      for (const log of workoutLogs) {
        const match = log.workoutExercises.find(
          (we: { exercise: { id: string; name: string }; sets: ExerciseSet[] }) =>
            we.exercise?.id === exerciseId || we.exercise?.name === exerciseName
        )
        if (match?.sets?.length) {
          setWorkoutExercises(prev => {
            const u = [...prev]
            u[idx].sets = match.sets.map((s: ExerciseSet, i: number) => ({
              setNumber: i + 1, reps: s.reps, weightKg: s.weightKg,
            }))
            return u
          })
          toast.success(`Loaded last session (${format(new Date(log.date), "MMM d")})`)
          return
        }
      }
      toast.info("No previous session found")
    } catch { toast.error("Failed to load previous session") }
  }

  const handleStartWorkout = () => {
    if (workoutExercises.length === 0) { toast.error("Add exercises first!"); return }
    if (selectedDay !== today) { setShowSwapDialog(true); return }
    setWorkoutStarted(true)
    toast.success(`${currentDaySchedule?.name || DAYS[selectedDay]} started! 💪`)
  }

  const handleConfirmDaySwap = async () => {
    setSwapLoading(true)
    try {
      const res = await fetch("/api/schedule/swap-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromDay: selectedDay, toDay: today, userId: session?.user?.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to swap days")
      setWorkoutStarted(true)
      setShowSwapDialog(false)
      await Promise.all([fetchWeeklySchedule(), fetchDaySchedule(selectedDay)])
      toast.success("Days swapped! Starting workout 💪")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to swap days")
    } finally { setSwapLoading(false) }
  }

  const handleSaveWorkout = async () => {
    setSaving(true)
    try {
      const completed = workoutExercises.filter(ex => ex.sets.some(s => s.reps > 0 && s.weightKg > 0))
      if (!completed.length) { toast.error("Complete at least one set first"); setSaving(false); return }
      const res = await fetch("/api/workout/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek: selectedDay, exercises: completed }),
      })
      if (res.ok) {
        toast.success("Workout saved! 🎉")
        fetchDaySchedule(selectedDay)
        window.dispatchEvent(new CustomEvent("workoutSaved"))
      } else toast.error("Failed to save workout")
    } catch { toast.error("Failed to save workout") }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Dumbbell className="h-8 w-8 animate-bounce" style={{ color: "var(--primary)" }} />
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading your workout…</p>
      </div>
    </div>
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  const hasData = workoutExercises.some(ex => ex.sets.some(s => s.reps > 0 && s.weightKg > 0))

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-6">

        {/* ── Hero header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: "var(--muted-foreground)" }}>
              {greeting()}, {session?.user?.name?.split(" ")[0] ?? "Athlete"} 👋
            </p>
            <h1 className="text-2xl font-black tracking-tight">
              {currentDaySchedule?.name ?? `${DAYS[selectedDay]} Workout`}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {format(new Date(), "EEEE, MMMM d")}
              {selectedDay !== today && <span className="ml-1 text-primary"> · Viewing {DAYS[selectedDay]}</span>}
            </p>
          </div>
          <FireStreakIndicator />
        </div>

        {/* ── Day navigation ── */}
        <DayNavigation
          selectedDay={selectedDay}
          onDaySelect={(d) => { setSelectedDay(d); setWorkoutStarted(false) }}
          weeklySchedule={weeklySchedule}
          loading={dayLoading}
          className="mb-5"
        />

        {/* ── Start / progress bar ── */}
        {!dayLoading && (
          <WorkoutStatusIndicator
            status={workoutStarted ? "in_progress" : "not_started"}
            onStartWorkout={handleStartWorkout}
            workoutName={currentDaySchedule?.name}
            exerciseCount={workoutExercises.length}
            completedSets={workoutExercises.reduce((t, ex) => t + ex.sets.filter(s => s.reps > 0 && s.weightKg > 0).length, 0)}
            totalSets={workoutExercises.reduce((t, ex) => t + ex.sets.length, 0)}
            disabled={dayLoading || swapLoading}
            className="mb-5"
          />
        )}

        {/* ── Day swap banner ── */}
        {showSwapBanner && (
          <div
            className="flex items-start gap-3 rounded-2xl p-3 mb-5"
            style={{ background: "oklch(0.62 0.19 244 / 10%)", border: "1px solid oklch(0.62 0.19 244 / 25%)" }}
          >
            <ArrowLeftRight className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
            <p className="text-xs flex-1" style={{ color: "var(--muted-foreground)" }}>
              Select any day and tap &quot;Start Workout&quot; to permanently swap it with today.
            </p>
            <button onClick={() => { setShowSwapBanner(false); localStorage.setItem("swapInfoBannerDismissed","true") }}
              className="p-0.5 rounded touch-manipulation" style={{ color: "var(--muted-foreground)" }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Action bar ── */}
        <div className="flex gap-2 mb-5">
          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)} className="gap-1.5 flex-1 h-10 touch-manipulation">
            <Plus className="h-4 w-4" />Add Exercise
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchDaySchedule(selectedDay)} disabled={dayLoading} className="h-10 w-10 p-0 touch-manipulation">
            <RefreshCw className={`h-4 w-4 ${dayLoading ? "animate-spin" : ""}`} />
          </Button>
          {hasData && (
            <Button size="sm" onClick={handleSaveWorkout} disabled={saving} className="gap-1.5 flex-1 h-10 touch-manipulation"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
        </div>

        {/* ── Loading skeleton ── */}
        {dayLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--card)" }} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!dayLoading && workoutExercises.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--muted)" }}>
              <Dumbbell className="h-8 w-8 opacity-30" style={{ color: "var(--foreground)" }} />
            </div>
            <div>
              <p className="font-semibold">No exercises for {DAYS[selectedDay]}</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Add exercises to build your workout</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 mt-2"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Plus className="h-4 w-4" />Add First Exercise
            </Button>
          </div>
        )}

        {/* ── Exercise list grouped by muscle ── */}
        {!dayLoading && workoutExercises.length > 0 && (
          <div className="space-y-2">
            {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
              <div key={muscleGroup}>
                {/* Section header */}
                <div className="flex items-center gap-2 px-1 mb-2 mt-4 first:mt-0">
                  <div className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: getMuscleColor(muscleGroup) }} />
                  <span className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--muted-foreground)" }}>
                    {muscleGroup}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>

                <div className="space-y-2">
                  {exercises.map(({ ex, idx }) => (
                    <ExerciseCard
                      key={`${ex.exerciseId}-${idx}`}
                      workoutExercise={ex}
                      exerciseIndex={idx}
                      prMap={prMap}
                      muscleColor={getMuscleColor(ex.exercise.muscleGroup)}
                      onAddSet={handleAddSet}
                      onRemoveSet={handleRemoveSet}
                      onSetChange={handleSetChange}
                      onRemoveExercise={handleRemoveExercise}
                      onReplaceExercise={handleReplaceExercise}
                      onCopyLastSession={handleCopyLastSession}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky summary bar */}
      <WorkoutSummaryBar workoutExercises={workoutExercises} prExerciseNames={prExerciseNames} />

      {/* Dialogs */}
      <AddCustomExerciseDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onExerciseAdded={handleAddCustomExercise} />
      {exerciseToReplace && (
        <ExerciseReplacementDialog
          open={isReplacementDialogOpen}
          onOpenChange={setIsReplacementDialogOpen}
          originalExercise={exerciseToReplace.exercise}
          onExerciseReplaced={handleExerciseReplaced}
        />
      )}
      <DaySwapConfirmationDialog
        open={showSwapDialog}
        onOpenChange={setShowSwapDialog}
        fromDay={selectedDay}
        toDay={today}
        fromDayName={currentDaySchedule?.name || DAYS[selectedDay]}
        toDayName={weeklySchedule.find(s => s.dayOfWeek === today)?.name || DAYS[today]}
        onConfirm={handleConfirmDaySwap}
        loading={swapLoading}
      />
    </div>
  )
}

// ── Exercise card ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise
  exerciseIndex: number
  prMap: Map<string, number>
  muscleColor: string
  onAddSet: (i: number) => void
  onRemoveSet: (ei: number, si: number) => void
  onSetChange: (ei: number, si: number, field: "reps" | "weightKg", val: number) => void
  onRemoveExercise: (i: number) => void
  onReplaceExercise: (i: number) => void
  onCopyLastSession: (id: string, name: string, i: number) => void
}

function ExerciseCard({
  workoutExercise, exerciseIndex, prMap, muscleColor,
  onAddSet, onRemoveSet, onSetChange,
  onRemoveExercise, onReplaceExercise, onCopyLastSession,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(true)
  const completedSets = workoutExercise.sets.filter(s => s.reps > 0 && s.weightKg > 0).length

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${muscleColor}`,
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
          style={{ background: `${muscleColor}20`, color: muscleColor }}
        >
          {workoutExercise.exercise.name[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-sm truncate">{workoutExercise.exercise.name}</p>
            {workoutExercise.isCustom && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Custom</Badge>
            )}
            {workoutExercise.originalExerciseName && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-orange-400 border-orange-400/40">
                Replaced
              </Badge>
            )}
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {workoutExercise.exercise.equipment}
            {completedSets > 0 && (
              <span className="ml-2 font-semibold" style={{ color: muscleColor }}>
                {completedSets}/{workoutExercise.sets.length} sets
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => onCopyLastSession(workoutExercise.exerciseId, workoutExercise.exercise.name, exerciseIndex)}
            className="h-8 w-8 rounded-lg flex items-center justify-center touch-manipulation hover:bg-white/5 transition-colors"
            title="Copy last session" style={{ color: "var(--muted-foreground)" }}>
            <ClipboardCopy className="h-3.5 w-3.5" />
          </button>
          {workoutExercise.exercise.videoUrl && (
            <button onClick={() => window.open(workoutExercise.exercise.videoUrl, "_blank")}
              className="h-8 w-8 rounded-lg flex items-center justify-center touch-manipulation hover:bg-white/5 transition-colors text-emerald-500">
              <Play className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onReplaceExercise(exerciseIndex)}
            className="h-8 w-8 rounded-lg flex items-center justify-center touch-manipulation hover:bg-white/5 transition-colors"
            style={{ color: "var(--primary)" }}>
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onRemoveExercise(exerciseIndex)}
            className="h-8 w-8 rounded-lg flex items-center justify-center touch-manipulation hover:bg-white/5 transition-colors text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="h-8 w-8 rounded-lg flex items-center justify-center touch-manipulation hover:bg-white/5 transition-colors"
            style={{ color: "var(--muted-foreground)" }}>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible sets section */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Column labels */}
          <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 pt-3 px-1">
            {["Set","Reps","kg",""].map((h, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-center"
                style={{ color: "var(--muted-foreground)" }}>{h}</span>
            ))}
          </div>

          {workoutExercise.sets.map((set, setIndex) => {
            const current1RM = set.reps > 0 && set.weightKg > 0 ? calculateEpley1RM(set.weightKg, set.reps) : 0
            const newPR = current1RM > 0 && isPR(current1RM, prMap.get(workoutExercise.exercise.name))
            const plateResult = set.weightKg > 20 ? calculatePlates(set.weightKg) : null
            const done = set.reps > 0 && set.weightKg > 0

            return (
              <div key={setIndex}>
                <div
                  className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 items-center p-2 rounded-xl transition-all duration-150"
                  style={{ background: done ? `${muscleColor}10` : "oklch(1 0 0 / 3%)" }}
                >
                  {/* Set number */}
                  <div className="flex items-center justify-center">
                    <span
                      className="text-xs font-black h-6 w-6 rounded-full flex items-center justify-center"
                      style={done ? { background: muscleColor, color: "#fff" } : { color: "var(--muted-foreground)" }}
                    >
                      {set.setNumber}
                    </span>
                  </div>

                  {/* Reps stepper */}
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onSetChange(exerciseIndex, setIndex, "reps", set.reps - 1)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                      style={{ background: "var(--muted)" }}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center font-black text-base tabular-nums">{set.reps}</span>
                    <button
                      onClick={() => onSetChange(exerciseIndex, setIndex, "reps", set.reps + 1)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                      style={{ background: "var(--muted)" }}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Weight stepper */}
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onSetChange(exerciseIndex, setIndex, "weightKg", Math.round((set.weightKg - 2.5) * 100) / 100)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                      style={{ background: "var(--muted)" }}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-10 text-center font-black text-sm tabular-nums">{set.weightKg}</span>
                    <button
                      onClick={() => onSetChange(exerciseIndex, setIndex, "weightKg", Math.round((set.weightKg + 2.5) * 100) / 100)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
                      style={{ background: "var(--muted)" }}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => onRemoveSet(exerciseIndex, setIndex)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg touch-manipulation"
                    style={{ color: "var(--destructive)" }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* PR / 1RM / plates row */}
                {(newPR || current1RM > 0 || plateResult) && (
                  <div className="flex items-center gap-2 px-2 pt-1 pb-0.5 flex-wrap">
                    {newPR && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "oklch(0.85 0.18 85 / 20%)", color: "#facc15" }}>
                        <Trophy className="h-2.5 w-2.5" />PR!
                      </span>
                    )}
                    {current1RM > 0 && (
                      <span className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                        ~{current1RM}kg 1RM
                      </span>
                    )}
                    {plateResult && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 touch-manipulation" style={{ color: "var(--muted-foreground)" }}>
                            <Dumbbell className="h-3 w-3" />
                            <span className="text-[10px] font-medium">plates</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-52 p-3" side="top">
                          <p className="text-xs font-bold mb-1">Each side (20kg bar)</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {plateResult.plates.map(({ weight, count }) =>
                              Array.from({ length: count }).map((_, i) => (
                                <span key={`${weight}-${i}`}
                                  className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                                  style={{ background: PLATE_COLORS[weight] ?? "#6b7280" }}>
                                  {weight}
                                </span>
                              ))
                            )}
                          </div>
                          {!plateResult.achievable && (
                            <p className="text-[10px] text-orange-400 mt-1">
                              Closest: {plateResult.totalWeight}kg
                            </p>
                          )}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={() => onAddSet(exerciseIndex)}
            className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80 touch-manipulation mt-1"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
            <Plus className="h-4 w-4" />Add Set
          </button>
        </div>
      )}
    </div>
  )
}
