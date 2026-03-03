"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/lib/theme-context"

export default function LoginPage() {
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if already logged in
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("userRole")
      const userId = localStorage.getItem("userId")
      
      if (userId) {
        // Redirect based on role
        if (userRole === "admin") {
          router.push("/admin")
        } else if (userRole === "teacher") {
          router.push("/teacher")
        } else {
          router.push("/student")
        }
      }
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.")
        setLoading(false)
        return
      }

      // Store user info in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("userId", data.user.id.toString())
        localStorage.setItem("username", data.user.name)
        localStorage.setItem("userFullName", data.user.name)
        localStorage.setItem("userEmail", data.user.email)
        localStorage.setItem("userRole", data.user.role)
        localStorage.setItem("userAvatar", data.user.avatar || "👨‍🎓")
        
        if (data.user.section_id) {
          localStorage.setItem("userSection", data.user.section_id)
        }
        
        if (data.user.employee_id) {
          localStorage.setItem("employeeId", data.user.employee_id)
        }
        
        if (data.user.subject) {
          localStorage.setItem("subject", data.user.subject)
        }

        if (data.user.section) {
          localStorage.setItem("userSection", data.user.section)
        }
        
        if (data.stats) {
          localStorage.setItem("userPoints", data.stats.points?.toString() || "0")
        }
      }

      // Redirect based on role
      router.push(data.redirectPath)
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] p-4">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
        >
          {isDarkMode ? (
            <i className="fas fa-sun text-yellow-400"></i>
          ) : (
            <i className="fas fa-moon"></i>
          )}
        </button>
      </div>
      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-full mb-4">
            <i className="fas fa-graduation-cap text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">EduTrack Pro</h1>
          <p className="text-gray-600 dark:text-gray-400">Unified Login System</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4361ee] focus:border-transparent outline-none transition"
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4361ee] focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <i className="fas fa-sign-in-alt"></i>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            <i className="fas fa-info-circle"></i> Demo credentials:
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-500">Student: alex@example.com / password</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Teacher: emily.johnson@school.edu / teacher123</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Admin: john.smith@school.edu / teacher123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
