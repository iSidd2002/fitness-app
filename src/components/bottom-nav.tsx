"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Dumbbell, BarChart3, History, MoreHorizontal, Trophy, Settings, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { FireStreakIndicator } from "@/components/fire-streak-indicator"

const tabs = [
  { label: "Diary", icon: Dumbbell, href: "/" },
  { label: "Progress", icon: BarChart3, href: "/dashboard" },
  { label: "History", icon: History, href: "/history" },
]

const HIDDEN_PATHS = ["/login", "/signup", "/admin"]

export function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        height: "var(--nav-height)",
        backgroundColor: "var(--sidebar)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ label, icon: Icon, href }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] touch-manipulation"
              style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}

        {/* More sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] touch-manipulation"
              style={{ color: "var(--muted-foreground)" }}
            >
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left">
                {session?.user?.name && (
                  <span className="text-base font-semibold">{session.user.name}</span>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-1">
              <FireStreakIndicator className="w-full justify-start px-3 py-3 rounded-xl hover:bg-muted" />

              <Link href="/leaderboard" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Leaderboard</span>
              </Link>

              {session?.user?.role === "ADMIN" && (
                <Link href="/admin/schedule" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors">
                  <Settings className="h-5 w-5 text-primary" />
                  <span className="font-medium">Admin Schedule</span>
                </Link>
              )}

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors w-full text-left"
                style={{ color: "var(--destructive)" }}
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
