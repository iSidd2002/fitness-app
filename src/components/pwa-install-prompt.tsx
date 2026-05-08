"use client"

import { useEffect, useState } from "react"
import { X, Download, Share, Plus } from "lucide-react"

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Platform = "android" | "ios" | "other"

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return "android"
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
    return "ios"
  return "other"
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error — iOS-only property
    window.navigator.standalone === true
  )
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<Platform>("other")
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const [iosStep, setIosStep] = useState(false)

  useEffect(() => {
    // Already installed or dismissed → don't show
    if (isStandalone()) return
    if (localStorage.getItem("pwaPromptDismissed") === "true") return

    const plat = getPlatform()
    setPlatform(plat)

    if (plat === "android") {
      // Android Chrome fires beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setTimeout(() => setShow(true), 3000)
      }
      window.addEventListener("beforeinstallprompt", handler)
      return () => window.removeEventListener("beforeinstallprompt", handler)
    }

    if (plat === "ios") {
      // iOS: only show in Safari (not already installed)
      const isSafari = /safari/i.test(navigator.userAgent) && !/chrome|crios/i.test(navigator.userAgent)
      if (isSafari) {
        setTimeout(() => setShow(true), 3500)
      }
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem("pwaPromptDismissed", "true")
  }

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShow(false)
        localStorage.setItem("pwaPromptDismissed", "true")
      }
    } finally {
      setInstalling(false)
      setDeferredPrompt(null)
    }
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={handleDismiss}
        style={{ backdropFilter: "blur(4px)" }}
      />

      {/* Bottom sheet */}
      <div
        className="fixed left-0 right-0 z-[70] rounded-t-3xl px-5 pt-5 pb-safe"
        style={{
          bottom: 0,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center touch-manipulation"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + title */}
        <div className="flex items-center gap-4 mb-5">
          {/* App icon */}
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--primary), oklch(0.55 0.22 270))" }}>
            <span className="text-2xl font-black text-white">IF</span>
          </div>
          <div>
            <h2 className="text-lg font-black">Add IncelFitness</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Install the app for the best experience
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { emoji: "⚡", label: "Fast" },
            { emoji: "📴", label: "Works offline" },
            { emoji: "🏠", label: "Home screen" },
          ].map(({ emoji, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl py-3"
              style={{ background: "var(--muted)" }}>
              <span className="text-xl">{emoji}</span>
              <span className="text-[11px] font-semibold" style={{ color: "var(--muted-foreground)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Android flow */}
        {platform === "android" && (
          <button
            onClick={handleInstallAndroid}
            disabled={installing}
            className="w-full h-13 rounded-2xl font-bold text-base flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] transition-transform mb-4"
            style={{
              background: "linear-gradient(135deg, var(--primary), oklch(0.55 0.22 270))",
              color: "white",
              height: 52,
              boxShadow: "0 4px 20px oklch(0.62 0.19 244 / 40%)",
            }}
          >
            <Download className="h-5 w-5" />
            {installing ? "Installing…" : "Install IncelFitness"}
          </button>
        )}

        {/* iOS flow — two-step instructions */}
        {platform === "ios" && !iosStep && (
          <button
            onClick={() => setIosStep(true)}
            className="w-full rounded-2xl font-bold text-base flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] transition-transform mb-4"
            style={{
              background: "linear-gradient(135deg, var(--primary), oklch(0.55 0.22 270))",
              color: "white",
              height: 52,
              boxShadow: "0 4px 20px oklch(0.62 0.19 244 / 40%)",
            }}
          >
            <Plus className="h-5 w-5" />
            Add to Home Screen
          </button>
        )}

        {platform === "ios" && iosStep && (
          <div className="rounded-2xl p-4 mb-4 space-y-3" style={{ background: "var(--muted)" }}>
            <p className="text-sm font-bold mb-1">Follow these steps in Safari:</p>
            {[
              { icon: Share, text: "Tap the Share button at the bottom of Safari" },
              { icon: Plus, text: 'Scroll down and tap "Add to Home Screen"' },
              { icon: null, text: 'Tap "Add" in the top-right corner' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white"
                  style={{ background: "var(--primary)" }}>
                  {i + 1}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  {Icon && <Icon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--primary)" }} />}
                  <p className="text-sm">{text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleDismiss}
          className="w-full h-11 rounded-2xl text-sm font-semibold touch-manipulation mb-2"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          Not now
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
