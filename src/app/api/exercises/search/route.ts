import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/exercises/search - Search exercises with fuzzy matching
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        exercises: [],
        query: query || '',
        total: 0,
        message: 'Query too short'
      })
    }

    // Create search terms for fuzzy matching
    const searchTerm = query.toLowerCase().trim()
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0)

    // Build search conditions for fuzzy matching
    const searchConditions = searchWords.map(word => ({
      OR: [
        {
          name: {
            contains: word,
            mode: 'insensitive' as const
          }
        },
        {
          description: {
            contains: word,
            mode: 'insensitive' as const
          }
        },
        {
          muscleGroup: {
            contains: word,
            mode: 'insensitive' as const
          }
        },
        {
          equipment: {
            contains: word,
            mode: 'insensitive' as const
          }
        }
      ]
    }))

    // Fetch exercises with fuzzy search
    const allExercises = await prisma.exercise.findMany({
      where: {
        AND: searchConditions
      },
      orderBy: [
        // Prioritize exact name matches
        {
          name: 'asc'
        }
      ],
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    // Filter for global exercises (no userId) and user's custom exercises
    const exercises = allExercises
      .filter(exercise => !exercise.userId || exercise.userId === session.user.id)
      .slice(0, limit)

    // Calculate relevance scores and sort by relevance
    const exercisesWithScores = exercises.map(exercise => {
      let score = 0
      const exerciseName = exercise.name.toLowerCase()
      const exerciseDesc = (exercise.description || '').toLowerCase()
      const exerciseMuscle = exercise.muscleGroup.toLowerCase()
      const exerciseEquipment = exercise.equipment.toLowerCase()

      // Exact name match gets highest score
      if (exerciseName === searchTerm) {
        score += 100
      }
      // Name starts with search term
      else if (exerciseName.startsWith(searchTerm)) {
        score += 80
      }
      // Name contains search term
      else if (exerciseName.includes(searchTerm)) {
        score += 60
      }

      // Muscle group matches
      if (exerciseMuscle === searchTerm) {
        score += 40
      } else if (exerciseMuscle.includes(searchTerm)) {
        score += 20
      }

      // Equipment matches
      if (exerciseEquipment === searchTerm) {
        score += 30
      } else if (exerciseEquipment.includes(searchTerm)) {
        score += 15
      }

      // Description matches
      if (exerciseDesc.includes(searchTerm)) {
        score += 10
      }

      // Bonus for each word match
      searchWords.forEach(word => {
        if (exerciseName.includes(word)) score += 5
        if (exerciseMuscle.includes(word)) score += 3
        if (exerciseEquipment.includes(word)) score += 2
        if (exerciseDesc.includes(word)) score += 1
      })

      // Slight bonus for global exercises (more commonly used)
      if (!exercise.userId) {
        score += 1
      }

      return {
        ...exercise,
        relevanceScore: score
      }
    })

    // Sort by relevance score (highest first)
    const sortedExercises = exercisesWithScores
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ relevanceScore: _relevanceScore, ...exercise }) => exercise) // Remove score from response

    return NextResponse.json({ 
      exercises: sortedExercises,
      query: query,
      total: sortedExercises.length
    })

  } catch (error) {
    console.error("Error searching exercises:", error)
    return NextResponse.json(
      { error: "Failed to search exercises" },
      { status: 500 }
    )
  }
}
