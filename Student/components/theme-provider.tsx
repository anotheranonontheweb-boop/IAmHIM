"use client"

import type * as React from "react"
import { ThemeContextProvider } from "@/lib/theme-context"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContextProvider>{children}</ThemeContextProvider>
}
