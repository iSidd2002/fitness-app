import { http, HttpResponse } from "msw"

export const validSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test User", role: "USER" },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}

export const expiredSession = null

export const handlers = {
  validSession: http.get("/api/auth/session", () => HttpResponse.json(validSession)),
  expiredSession: http.get("/api/auth/session", () => HttpResponse.json(expiredSession)),
  unauthorized: http.get("/api/auth/session", () => new HttpResponse(null, { status: 401 })),
}
