import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const swSource = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf-8")

// Extract STATIC_ASSETS array from sw.js source
function extractStaticAssets(source: string): string[] {
  const match = source.match(/const\s+STATIC_ASSETS\s*=\s*\[([^\]]*)\]/)
  if (!match) return []
  return match[1]
    .split(",")
    .map((s) => s.trim().replace(/['"]/g, ""))
    .filter(Boolean)
}

// Extract CACHE_NAME from sw.js source
function extractCacheName(source: string): string {
  const match = source.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/)
  return match ? match[1] : ""
}

const staticAssets = extractStaticAssets(swSource)
const cacheName = extractCacheName(swSource)

describe("Service Worker", () => {
  it("STATIC_ASSETS does not include /", () => {
    expect(staticAssets).not.toContain("/")
  })

  it("STATIC_ASSETS does not include /dashboard", () => {
    expect(staticAssets).not.toContain("/dashboard")
  })

  it("STATIC_ASSETS does not include /history", () => {
    expect(staticAssets).not.toContain("/history")
  })

  it("STATIC_ASSETS does not include /leaderboard", () => {
    expect(staticAssets).not.toContain("/leaderboard")
  })

  it("STATIC_ASSETS contains /manifest.json", () => {
    expect(staticAssets).toContain("/manifest.json")
  })

  it("CACHE_NAME is incelfit-v2 (not v1)", () => {
    expect(cacheName).toBe("incelfit-v2")
  })
})
