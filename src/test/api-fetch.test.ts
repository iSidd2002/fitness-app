import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock next-auth/react before importing apiFetch
vi.mock("next-auth/react", () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { apiFetch } from "@/lib/api-fetch"
import { signOut } from "next-auth/react"

function mockFetch(status: number, body: unknown = {}) {
  return vi.spyOn(global, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("apiFetch", () => {
  it("passes through 200 response unchanged", async () => {
    mockFetch(200, { data: "ok" })
    const res = await apiFetch("/api/workouts")
    expect(res.status).toBe(200)
    expect(signOut).not.toHaveBeenCalled()
  })

  it("calls signOut on 401 response", async () => {
    mockFetch(401)
    // apiFetch on 401 calls signOut and returns a never-resolving promise
    const result = Promise.race([
      apiFetch("/api/workouts"),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 100)),
    ])
    await expect(result).resolves.toBe("timeout")
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login", redirect: true })
  })

  it("does NOT call signOut on 403 response", async () => {
    mockFetch(403, { error: "Forbidden" })
    const res = await apiFetch("/api/workouts")
    expect(res.status).toBe(403)
    expect(signOut).not.toHaveBeenCalled()
  })

  it("does NOT call signOut on 404 response", async () => {
    mockFetch(404, { error: "Not found" })
    const res = await apiFetch("/api/workouts")
    expect(res.status).toBe(404)
    expect(signOut).not.toHaveBeenCalled()
  })

  it("does NOT call signOut on 500 response", async () => {
    mockFetch(500, { error: "Server error" })
    const res = await apiFetch("/api/workouts")
    expect(res.status).toBe(500)
    expect(signOut).not.toHaveBeenCalled()
  })

  it("propagates network errors without calling signOut", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new TypeError("Failed to fetch"))
    await expect(apiFetch("/api/workouts")).rejects.toThrow("Failed to fetch")
    expect(signOut).not.toHaveBeenCalled()
  })

  it("forwards request options to fetch", async () => {
    const spy = mockFetch(200)
    await apiFetch("/api/workouts", { method: "POST", body: '{"x":1}' })
    expect(spy).toHaveBeenCalledWith("/api/workouts", { method: "POST", body: '{"x":1}' })
  })
})
