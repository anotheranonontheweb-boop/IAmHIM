"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"

interface LeaderboardEntry {
  id: number
  name: string
  grade: string
  streak: number
  points: number
  total_points: number
  class_rank: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (typeof window !== "undefined") {
        const userId = localStorage.getItem("userId")

        if (!userId) {
          router.push("/")
          return
        }

        try {
          const response = await fetch(`/api/leaderboard?category=streak&period=alltime`)
          if (response.ok) {
            const data = await response.json()
            setLeaderboard(data.leaderboard)
          }
        } catch (error) {
          console.error("Failed to fetch leaderboard:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchLeaderboard()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
        <Header activePage="leaderboard" />
        <main className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee] mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading leaderboard...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      <Header activePage="leaderboard" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
            <i className="fas fa-trophy text-[#f8961e]"></i>
            Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Top performers in attendance and participation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Streak Leaders */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <i className="fas fa-fire text-orange-500"></i>
              Streak Leaders
            </h2>
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                leaderboard.map((leader, index) => (
                  <div
                    key={leader.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f172a] transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-400 to-blue-600">
                        {leader.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{leader.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Grade {leader.grade}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-orange-500">{leader.streak}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">days</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No leaderboard data available</p>
              )}
            </div>
          </div>

          {/* Class Points */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <i className="fas fa-users text-[#4361ee]"></i>
              Class Points
            </h2>
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                leaderboard.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f172a] transition"
                  >
                    <span className="text-2xl font-bold text-gray-400">#{item.class_rank}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Grade {item.grade}</div>
                    </div>
                    <div className="text-xl font-bold text-[#4361ee]">{item.total_points}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No leaderboard data available</p>
              )}
            </div>
          </div>

          {/* Individual Points */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <i className="fas fa-star text-yellow-500"></i>
              Individual Points
            </h2>
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                leaderboard.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f172a] transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-400 to-blue-600">
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{student.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Grade {student.grade}</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-yellow-500">{student.points}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No leaderboard data available</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
