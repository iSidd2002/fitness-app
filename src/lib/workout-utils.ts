export interface PlateResult {
  plates: { weight: number; count: number }[]
  totalWeight: number
  achievable: boolean
  remainder: number
}

const PLATE_DENOMINATIONS = [20, 15, 10, 5, 2.5, 1.25]

export function calculatePlates(targetWeight: number, barWeight = 20): PlateResult {
  const perSide = (targetWeight - barWeight) / 2
  if (perSide <= 0) {
    return { plates: [], totalWeight: barWeight, achievable: targetWeight === barWeight, remainder: 0 }
  }

  let remaining = perSide
  const plates: { weight: number; count: number }[] = []

  for (const denom of PLATE_DENOMINATIONS) {
    const count = Math.floor(remaining / denom + 0.001)
    if (count > 0) {
      plates.push({ weight: denom, count })
      remaining -= count * denom
      remaining = Math.round(remaining * 1000) / 1000
    }
  }

  const totalWeight = barWeight + (perSide - remaining) * 2
  return {
    plates,
    totalWeight: Math.round(totalWeight * 100) / 100,
    achievable: remaining < 0.01,
    remainder: Math.round(remaining * 1000) / 1000,
  }
}

export function calculateEpley1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  return Math.round(weightKg * (1 + reps / 30))
}

export function isPR(current1RM: number, storedMax1RM?: number): boolean {
  if (!storedMax1RM || storedMax1RM <= 0) return false
  return current1RM > storedMax1RM
}

export const PLATE_COLORS: Record<number, string> = {
  20: "#dc2626",   // red
  15: "#ca8a04",   // yellow
  10: "#16a34a",   // green
  5: "#6b7280",    // gray
  2.5: "#2563eb",  // blue
  1.25: "#9ca3af", // silver
}
