// Service for fetching exercises from external APIs
interface ExternalExercise {
  id: string
  name: string
  target: string
  bodyPart: string
  equipment: string
  instructions: string[]
  gifUrl?: string
}

interface ExerciseDBResponse {
  id: string
  name: string
  target: string
  bodyPart: string
  equipment: string
  instructions: string[]
  gifUrl: string
}

export class ExerciseAPIService {
  private static readonly EXERCISE_DB_URL = 'https://exercisedb.p.rapidapi.com'
  private static readonly API_KEY = process.env.RAPIDAPI_KEY || ''

  // Map ExerciseDB body parts to our muscle groups
  private static mapBodyPartToMuscleGroup(bodyPart: string): string {
    const mapping: Record<string, string> = {
      'chest': 'Chest',
      'back': 'Back',
      'shoulders': 'Shoulders',
      'upper arms': 'Arms',
      'lower arms': 'Arms',
      'upper legs': 'Legs',
      'lower legs': 'Legs',
      'waist': 'Core',
      'cardio': 'Cardio',
      'neck': 'Shoulders'
    }
    return mapping[bodyPart.toLowerCase()] || 'Other'
  }

  // Map ExerciseDB equipment to our equipment types
  private static mapEquipment(equipment: string): string {
    const mapping: Record<string, string> = {
      'barbell': 'Barbell',
      'dumbbell': 'Dumbbells',
      'cable': 'Cable Machine',
      'machine': 'Machine',
      'body weight': 'Bodyweight',
      'resistance band': 'Resistance Bands',
      'kettlebell': 'Kettlebell',
      'assisted': 'Machine',
      'leverage machine': 'Machine',
      'smith machine': 'Machine',
      'stability ball': 'Other',
      'medicine ball': 'Other',
      'olympic barbell': 'Barbell',
      'ez barbell': 'Barbell',
      'tire': 'Other',
      'rope': 'Other',
      'skierg machine': 'Machine',
      'stationary bike': 'Machine',
      'stepmill machine': 'Machine',
      'elliptical machine': 'Machine',
      'upper body ergometer': 'Machine'
    }
    return mapping[equipment.toLowerCase()] || 'Other'
  }

  // Fetch exercises by body part
  static async fetchExercisesByBodyPart(bodyPart: string): Promise<ExternalExercise[]> {
    if (!this.API_KEY) {
      console.warn('RAPIDAPI_KEY not configured, skipping external API call')
      return []
    }

    try {
      const response = await fetch(`${this.EXERCISE_DB_URL}/exercises/bodyPart/${bodyPart}`, {
        headers: {
          'X-RapidAPI-Key': this.API_KEY,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data: ExerciseDBResponse[] = await response.json()
      
      return data.map(exercise => ({
        id: exercise.id,
        name: this.formatExerciseName(exercise.name),
        target: exercise.target,
        bodyPart: exercise.bodyPart,
        equipment: this.mapEquipment(exercise.equipment),
        instructions: exercise.instructions,
        gifUrl: exercise.gifUrl
      }))
    } catch (error) {
      console.error(`Error fetching exercises for ${bodyPart}:`, error)
      return []
    }
  }

  // Fetch all exercises (limited to avoid rate limits)
  static async fetchAllExercises(limit: number = 100): Promise<ExternalExercise[]> {
    if (!this.API_KEY) {
      console.warn('RAPIDAPI_KEY not configured, skipping external API call')
      return []
    }

    try {
      const response = await fetch(`${this.EXERCISE_DB_URL}/exercises?limit=${limit}`, {
        headers: {
          'X-RapidAPI-Key': this.API_KEY,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data: ExerciseDBResponse[] = await response.json()
      
      return data.map(exercise => ({
        id: exercise.id,
        name: this.formatExerciseName(exercise.name),
        target: exercise.target,
        bodyPart: exercise.bodyPart,
        equipment: this.mapEquipment(exercise.equipment),
        instructions: exercise.instructions,
        gifUrl: exercise.gifUrl
      }))
    } catch (error) {
      console.error('Error fetching all exercises:', error)
      return []
    }
  }

  // Format exercise name to title case
  private static formatExerciseName(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Convert external exercise to our database format
  static convertToDbFormat(externalExercise: ExternalExercise) {
    return {
      name: externalExercise.name,
      description: externalExercise.instructions.join(' '),
      muscleGroup: this.mapBodyPartToMuscleGroup(externalExercise.bodyPart),
      equipment: externalExercise.equipment,
      videoUrl: externalExercise.gifUrl,
      // No userId means it's a global exercise
    }
  }

  // Get available body parts
  static getAvailableBodyParts(): string[] {
    return [
      'back',
      'cardio',
      'chest', 
      'lower arms',
      'lower legs',
      'neck',
      'shoulders',
      'upper arms',
      'upper legs',
      'waist'
    ]
  }
}
