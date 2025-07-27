import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const reorderSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  exercises: z.array(z.object({
    id: z.string(),
    order: z.number()
  }))
})

// PUT /api/admin/schedule/reorder - Reorder exercises in a day
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = reorderSchema.parse(body)

    // Update each exercise's order
    for (const exercise of validatedData.exercises) {
      await prisma.scheduleExercise.update({
        where: { id: exercise.id },
        data: { order: exercise.order }
      })
    }

    return NextResponse.json(
      { message: "Exercises reordered successfully" },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error reordering exercises:", error)
    return NextResponse.json(
      { error: "Failed to reorder exercises" },
      { status: 500 }
    )
  }
}
