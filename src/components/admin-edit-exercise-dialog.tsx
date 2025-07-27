"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Edit, Save, X, Plus, Trash2, ExternalLink, Video, Link as LinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ScheduleExercise {
  id: string
  exerciseId: string
  order: number
  exercise: Exercise
}

interface ReferenceLink {
  id: string
  title: string
  url: string
  type: 'tutorial' | 'form-guide' | 'reference' | 'other'
}

interface AdminEditExerciseDialogProps {
  scheduleExercise: ScheduleExercise
  onExerciseUpdated: () => void
  disabled?: boolean
}

const muscleGroups = [
  "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Glutes", "Cardio", "Full Body", "Other"
]

const equipmentTypes = [
  "Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight", "Resistance Band", 
  "Kettlebell", "Medicine Ball", "TRX", "Other"
]

const linkTypes = [
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'form-guide', label: 'Form Guide' },
  { value: 'reference', label: 'Reference' },
  { value: 'other', label: 'Other' }
]

export function AdminEditExerciseDialog({ 
  scheduleExercise, 
  onExerciseUpdated, 
  disabled = false 
}: AdminEditExerciseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    muscleGroup: "",
    equipment: "",
    videoUrl: "",
  })
  const [referenceLinks, setReferenceLinks] = useState<ReferenceLink[]>([])
  const [newLink, setNewLink] = useState<{ title: string; url: string; type: 'tutorial' | 'form-guide' | 'reference' | 'other' }>({ title: "", url: "", type: "tutorial" })

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && scheduleExercise) {
      setFormData({
        name: scheduleExercise.exercise.name || "",
        description: scheduleExercise.exercise.description || "",
        muscleGroup: scheduleExercise.exercise.muscleGroup || "",
        equipment: scheduleExercise.exercise.equipment || "",
        videoUrl: scheduleExercise.exercise.videoUrl || "",
      })
      // TODO: Load reference links from database
      setReferenceLinks([])
    }
  }, [open, scheduleExercise])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addReferenceLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error("Please fill in both title and URL")
      return
    }

    // Basic URL validation
    try {
      new URL(newLink.url)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    const link: ReferenceLink = {
      id: Date.now().toString(),
      title: newLink.title.trim(),
      url: newLink.url.trim(),
      type: newLink.type
    }

    setReferenceLinks(prev => [...prev, link])
    setNewLink({ title: "", url: "", type: "tutorial" })
  }

  const removeReferenceLink = (id: string) => {
    setReferenceLinks(prev => prev.filter(link => link.id !== id))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Exercise name is required")
      return
    }

    if (!formData.muscleGroup) {
      toast.error("Muscle group is required")
      return
    }

    if (!formData.equipment) {
      toast.error("Equipment is required")
      return
    }

    // Validate video URL if provided
    if (formData.videoUrl && formData.videoUrl.trim()) {
      try {
        new URL(formData.videoUrl.trim())
      } catch {
        toast.error("Please enter a valid video URL")
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/exercises/${scheduleExercise.exercise.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          muscleGroup: formData.muscleGroup,
          equipment: formData.equipment,
          videoUrl: formData.videoUrl.trim() || null,
          referenceLinks: referenceLinks
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update exercise")
      }

      toast.success("Exercise updated successfully")
      setOpen(false)
      onExerciseUpdated()
    } catch (error) {
      console.error("Error updating exercise:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update exercise")
    } finally {
      setLoading(false)
    }
  }

  const getLinkTypeIcon = (type: string) => {
    switch (type) {
      case 'tutorial': return <Video className="h-3 w-3" />
      case 'form-guide': return <LinkIcon className="h-3 w-3" />
      case 'reference': return <ExternalLink className="h-3 w-3" />
      default: return <LinkIcon className="h-3 w-3" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 touch-manipulation"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Exercise: {scheduleExercise.exercise.name}
          </DialogTitle>
          <DialogDescription>
            Modify exercise details, add video links, and manage reference materials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Exercise Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exercise Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Exercise Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter exercise name"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="muscleGroup">Muscle Group *</Label>
                  <Select 
                    value={formData.muscleGroup} 
                    onValueChange={(value) => handleInputChange("muscleGroup", value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select muscle group" />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment">Equipment *</Label>
                  <Select 
                    value={formData.equipment} 
                    onValueChange={(value) => handleInputChange("equipment", value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map((equipment) => (
                        <SelectItem key={equipment} value={equipment}>
                          {equipment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter exercise description, form cues, or notes..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reference Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Reference Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Link */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  placeholder="Link title"
                  value={newLink.title}
                  onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                  disabled={loading}
                />
                <Input
                  placeholder="https://..."
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  disabled={loading}
                />
                <Select
                  value={newLink.type}
                  onValueChange={(value: 'tutorial' | 'form-guide' | 'reference' | 'other') => setNewLink(prev => ({ ...prev, type: value }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {linkTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addReferenceLink} disabled={loading} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Existing Links */}
              {referenceLinks.length > 0 && (
                <div className="space-y-2">
                  {referenceLinks.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        {getLinkTypeIcon(link.type)}
                        <span className="font-medium">{link.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {linkTypes.find(t => t.value === link.type)?.label}
                        </Badge>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm truncate"
                        >
                          {link.url}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReferenceLink(link.id)}
                        disabled={loading}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {referenceLinks.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No reference links added yet. Add links to tutorials, form guides, or other helpful resources.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
