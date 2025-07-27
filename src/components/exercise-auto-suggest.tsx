"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Loader2, Plus } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroup: string
  equipment: string
  videoUrl?: string
  userId?: string
}

interface ExerciseAutoSuggestProps {
  value: string
  onChange: (value: string) => void
  onExerciseSelect: (exercise: Exercise) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showCreateOption?: boolean
  onCreateNew?: () => void
  minCharacters?: number
  maxSuggestions?: number
}

export function ExerciseAutoSuggest({
  value,
  onChange,
  onExerciseSelect,
  placeholder = "Search exercises...",
  className = "",
  disabled = false,
  showCreateOption = false,
  onCreateNew,
  minCharacters = 2,
  maxSuggestions = 8
}: ExerciseAutoSuggestProps) {
  const [suggestions, setSuggestions] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [searchCache, setSearchCache] = useState<Map<string, Exercise[]>>(new Map())

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchTerm: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(async () => {
        if (searchTerm.length < minCharacters) {
          setSuggestions([])
          setShowSuggestions(false)
          return
        }

        // Check cache first
        const cacheKey = `${searchTerm.toLowerCase()}-${maxSuggestions}`
        if (searchCache.has(cacheKey)) {
          const cachedResults = searchCache.get(cacheKey)!
          setSuggestions(cachedResults)
          setShowSuggestions(true)
          setSelectedIndex(-1)
          return
        }

        setIsLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/exercises/search?q=${encodeURIComponent(searchTerm)}&limit=${maxSuggestions}`)

          if (!response.ok) {
            throw new Error('Failed to fetch suggestions')
          }

          const data = await response.json()
          const exercises = data.exercises || []

          // Cache the results
          setSearchCache(prev => {
            const newCache = new Map(prev)
            newCache.set(cacheKey, exercises)
            // Limit cache size to prevent memory issues
            if (newCache.size > 50) {
              const firstKey = newCache.keys().next().value
              if (firstKey) {
                newCache.delete(firstKey)
              }
            }
            return newCache
          })

          setSuggestions(exercises)
          setShowSuggestions(true)
          setSelectedIndex(-1)
        } catch (error) {
          console.error('Error fetching exercise suggestions:', error)
          setError('Failed to load suggestions')
          setSuggestions([])
          setShowSuggestions(false)
        } finally {
          setIsLoading(false)
        }
      }, 300) // 300ms debounce delay
    },
    [minCharacters, maxSuggestions]
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    debouncedSearch(newValue)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 + (showCreateOption ? 1 : 0) ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleExerciseSelect(suggestions[selectedIndex])
          } else if (showCreateOption && onCreateNew) {
            onCreateNew()
          }
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle exercise selection
  const handleExerciseSelect = (exercise: Exercise) => {
    onExerciseSelect(exercise)
    onChange(exercise.name)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  // Handle create new option
  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew()
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  // Handle input focus
  const handleFocus = () => {
    if (value.length >= minCharacters && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Handle input blur (with delay to allow clicks)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${className}`}
          disabled={disabled}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto shadow-lg border">
          <CardContent className="p-0">
            {error ? (
              <div className="p-3 text-sm text-red-600 text-center">
                {error}
              </div>
            ) : suggestions.length === 0 && !isLoading ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No exercises found
                {showCreateOption && onCreateNew && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateNew}
                    className="ml-2 h-auto p-1 text-blue-600 hover:text-blue-700"
                  >
                    Create new
                  </Button>
                )}
              </div>
            ) : (
              <div ref={suggestionsRef}>
                {suggestions.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                      selectedIndex === index
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleExerciseSelect(exercise)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {highlightMatch(exercise.name, value)}
                        </div>
                        {exercise.description && (
                          <div className="text-xs text-gray-600 truncate mt-1">
                            {highlightMatch(exercise.description, value)}
                          </div>
                        )}
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {highlightMatch(exercise.muscleGroup, value)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {highlightMatch(exercise.equipment, value)}
                          </Badge>
                          {exercise.userId && (
                            <Badge variant="secondary" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Create new option */}
                {showCreateOption && onCreateNew && (
                  <div
                    className={`p-3 cursor-pointer border-t transition-colors ${
                      selectedIndex === suggestions.length
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={handleCreateNew}
                  >
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Create new exercise &quot;{value}&quot;
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
