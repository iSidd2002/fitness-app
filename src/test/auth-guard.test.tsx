import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const mockPush = vi.fn()

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}))

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

// Minimal UI stubs so the component renders without full Radix/Tailwind
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

vi.mock("lucide-react", () => ({
  Loader2: () => <span data-testid="loader" />,
  AlertCircle: () => <span data-testid="alert-circle" />,
  Shield: () => <span data-testid="shield" />,
}))

import { useSession } from "next-auth/react"
import { AuthGuard } from "@/components/auth-guard"

const mockUseSession = useSession as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("AuthGuard", () => {
  it("shows loading spinner while status is loading", () => {
    mockUseSession.mockReturnValue({ data: null, status: "loading" })
    render(<AuthGuard><div>Protected</div></AuthGuard>)
    expect(screen.getByTestId("loader")).toBeInTheDocument()
    expect(screen.queryByText("Protected")).not.toBeInTheDocument()
  })

  it("renders children when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", email: "a@b.com", name: "A", role: "USER" } },
      status: "authenticated",
    })
    render(<AuthGuard><div>Protected</div></AuthGuard>)
    expect(screen.getByText("Protected")).toBeInTheDocument()
  })

  it("shows auth required UI when unauthenticated", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" })
    render(<AuthGuard><div>Protected</div></AuthGuard>)
    expect(screen.getByText("Authentication Required")).toBeInTheDocument()
    expect(screen.queryByText("Protected")).not.toBeInTheDocument()
  })

  it("does not flash protected content during loading", () => {
    mockUseSession.mockReturnValue({ data: null, status: "loading" })
    render(<AuthGuard><div>Secret content</div></AuthGuard>)
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument()
  })

  it("shows admin required UI when requireAdmin but user is USER", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", email: "a@b.com", name: "A", role: "USER" } },
      status: "authenticated",
    })
    render(<AuthGuard requireAdmin><div>Admin only</div></AuthGuard>)
    expect(screen.getByText("Admin Access Required")).toBeInTheDocument()
    expect(screen.queryByText("Admin only")).not.toBeInTheDocument()
  })

  it("renders children when requireAdmin and user is ADMIN", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", email: "a@b.com", name: "A", role: "ADMIN" } },
      status: "authenticated",
    })
    render(<AuthGuard requireAdmin><div>Admin panel</div></AuthGuard>)
    expect(screen.getByText("Admin panel")).toBeInTheDocument()
  })
})
