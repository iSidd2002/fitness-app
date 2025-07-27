"use client"

import { useState } from "react"
import { ArrowLeftRight, Calendar, AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface DaySwapConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromDay: number
  toDay: number
  fromDayName: string
  toDayName: string
  onConfirm: () => Promise<void>
  loading?: boolean
}

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

export function DaySwapConfirmationDialog({
  open,
  onOpenChange,
  fromDay,
  toDay,
  fromDayName,
  toDayName,
  onConfirm,
  loading = false
}: DaySwapConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error confirming day swap:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  const today = new Date().getDay()
  const isFromDayToday = fromDay === today
  const isToDayToday = toDay === today

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 rounded-lg">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <ArrowLeftRight className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-lg font-semibold">
            Swap Workout Days?
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            This will permanently swap the workout schedules between these two days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning for today's workout */}
          {(isFromDayToday || isToDayToday) && (
            <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Today&apos;s workout will change!</p>
                <p>
                  {isFromDayToday 
                    ? `Today will become "${toDayName}" instead of "${fromDayName}"`
                    : `Today will become "${fromDayName}" instead of "${toDayName}"`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Swap visualization */}
          <div className="space-y-3">
            <div className="text-center text-xs font-medium text-gray-700 mb-3">
              What will happen:
            </div>
            
            {/* From Day */}
            <Card className="border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">
                        {daysOfWeek[fromDay]}
                        {isFromDayToday && (
                          <Badge variant="outline" className="ml-2 text-xs">Today</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">Currently: {fromDayName}</div>
                    </div>
                  </div>
                  <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                  Will become: <span className="font-medium">{toDayName}</span>
                </div>
              </CardContent>
            </Card>

            {/* To Day */}
            <Card className="border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">
                        {daysOfWeek[toDay]}
                        {isToDayToday && (
                          <Badge variant="outline" className="ml-2 text-xs">Today</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">Currently: {toDayName}</div>
                    </div>
                  </div>
                  <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                  Will become: <span className="font-medium">{fromDayName}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isConfirming || loading}
              className="flex-1 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || loading}
              className="flex-1 order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
            >
              {isConfirming || loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Swapping...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Confirm Swap
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            This change will be saved and persist across sessions.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
