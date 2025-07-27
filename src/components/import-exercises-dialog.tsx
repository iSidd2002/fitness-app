"use client"

import { useState } from "react"
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ImportResult {
  imported: number
  skipped: number
  total: number
  message: string
}

interface ImportExercisesDialogProps {
  onImportComplete?: () => void
}

export function ImportExercisesDialog({ onImportComplete }: ImportExercisesDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [bodyPart, setBodyPart] = useState<string>("all")
  const [limit, setLimit] = useState(50)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [apiConfigured, setApiConfigured] = useState(true)
  const [importSource, setImportSource] = useState<"api" | "local">("local")

  const bodyParts = [
    { value: "all", label: "All Body Parts" },
    { value: "chest", label: "Chest" },
    { value: "back", label: "Back" },
    { value: "shoulders", label: "Shoulders" },
    { value: "upper arms", label: "Upper Arms" },
    { value: "lower arms", label: "Lower Arms" },
    { value: "upper legs", label: "Upper Legs" },
    { value: "lower legs", label: "Lower Legs" },
    { value: "waist", label: "Core/Waist" },
    { value: "cardio", label: "Cardio" },
    { value: "neck", label: "Neck" }
  ]

  const handleImport = async () => {
    setIsLoading(true)
    setImportResult(null)

    try {
      const endpoint = importSource === "local"
        ? "/api/admin/exercises/import-local"
        : "/api/admin/exercises/import"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: importSource === "api" ? JSON.stringify({
          bodyPart: bodyPart === "all" ? undefined : bodyPart,
          limit: bodyPart === "all" ? limit : undefined
        }) : undefined,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import exercises")
      }

      const result: ImportResult = await response.json()
      setImportResult(result)

      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} exercises!`)
        onImportComplete?.()
      } else {
        toast.info("No new exercises were imported")
      }

    } catch (error) {
      console.error("Import error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to import exercises")
    } finally {
      setIsLoading(false)
    }
  }

  const checkApiStatus = async () => {
    try {
      const response = await fetch("/api/admin/exercises/import")
      if (response.ok) {
        const data = await response.json()
        setApiConfigured(data.apiConfigured)
      }
    } catch (error) {
      console.error("Error checking API status:", error)
      setApiConfigured(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={checkApiStatus}
        >
          <Download className="h-4 w-4" />
          Import Exercises
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Exercises</DialogTitle>
          <DialogDescription>
            Import exercises from local database or ExerciseDB API to expand your exercise database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="source">Import Source</Label>
              <Select value={importSource} onValueChange={(value: "api" | "local") => setImportSource(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select import source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Database (50+ exercises)</SelectItem>
                  <SelectItem value="api">ExerciseDB API (1000+ exercises)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {importSource === "api" && !apiConfigured && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">
                      API key not configured. Add RAPIDAPI_KEY to your environment variables.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {importSource === "api" && (
              <>
                <div>
                  <Label htmlFor="bodyPart">Body Part</Label>
                  <Select value={bodyPart} onValueChange={setBodyPart}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body part" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyParts.map((part) => (
                        <SelectItem key={part.value} value={part.value}>
                          {part.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {bodyPart === "all" && (
                  <div>
                    <Label htmlFor="limit">Limit (max exercises to import)</Label>
                    <Input
                      id="limit"
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
                      min={1}
                      max={200}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 50-100 to avoid rate limits
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {importResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total exercises found:</span>
                  <Badge variant="secondary">{importResult.total}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Successfully imported:</span>
                  <Badge className="bg-green-600">{importResult.imported}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Skipped (already exist):</span>
                  <Badge variant="outline">{importResult.skipped}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || (importSource === "api" && !apiConfigured)}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Importing..." : `Import from ${importSource === "local" ? "Local Database" : "ExerciseDB API"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
