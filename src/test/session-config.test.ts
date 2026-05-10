import { describe, it, expect } from "vitest"

// Mock Prisma so authOptions can be imported without a DB connection
vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("bcryptjs", () => ({ compare: vi.fn() }))

import { authOptions } from "@/lib/auth"

describe("authOptions session config", () => {
  it("strategy is jwt", () => {
    expect(authOptions.session?.strategy).toBe("jwt")
  })

  it("maxAge is 30 days in seconds", () => {
    expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60)
  })

  it("updateAge is 24 hours in seconds", () => {
    expect(authOptions.session?.updateAge).toBe(24 * 60 * 60)
  })

  it("does not have a custom cookies override (would break withAuth on HTTPS)", () => {
    expect((authOptions as Record<string, unknown>).cookies).toBeUndefined()
  })
})
