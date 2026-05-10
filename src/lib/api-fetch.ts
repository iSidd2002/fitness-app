"use client"

import { signOut } from "next-auth/react"

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init)
  if (response.status === 401) {
    await signOut({ callbackUrl: "/login", redirect: true })
    return new Promise(() => {}) // redirect in progress, never resolves
  }
  return response
}
