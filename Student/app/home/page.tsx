"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { formatOrdinal } from "@/lib/utils"

interface UserStats {
  streak: number
  points: number
  total_points: number
  class_rank: number
  total_rank: number
}

export default function HomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState("John Smith")
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (typeof window !== "undefined") {
        const userId = localStorage.getItem("userId")

        if (!userId) {
          router.push("/")
          return
        }

        try {
          // Fetch user stats from database API instead of localStorage
          const response = await fetch(`/api/user/stats?userId=${userId}`)
          if (response.ok) {
            const data = await response.json()
            setUserName(data.user.name)
            setStats(data.stats)
          }

          // Fetch recent activity
          const activityRes = await fetch(`/api/recent-activities?userId=${userId}`)
          if (activityRes.ok) {
            const activityData = await activityRes.json()
            setRecentActivity(activityData.activities?.slice(0, 5) || [])
          }
        } catch (error) {
          console.error("Failed to fetch stats:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
        <Header activePage="home" />
        <main className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee] mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your data...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      <Header activePage="home" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}! 👋</h1>
              <p className="text-white/90">Here&apos;s your attendance summary for today</p>
            </div>
            <div className="text-center bg-white/20 rounded-xl px-8 py-4">
              <div className="text-4xl font-bold">{stats?.streak || 0}</div>
              <div className="text-sm opacity-90">Day Streak 🔥</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Points</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.points || 0}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-full flex items-center justify-center">
                <i className="fas fa-star text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Class Rank</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.class_rank ? formatOrdinal(stats.class_rank) : "-"}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#f8961e] to-[#f72585] rounded-full flex items-center justify-center">
                <i className="fas fa-trophy text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Overall Rank</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_rank ? formatOrdinal(stats.total_rank) : "-"}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#4cc9f0] to-[#00b4d8] rounded-full flex items-center justify-center">
                <i className="fas fa-calendar-check text-white text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <i className="fas fa-bolt text-[#4361ee]"></i>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: "fa-trophy",
                title: "View Leaderboard",
                desc: "Check your ranking",
                href: "/leaderboard",
                color: "from-[#f8961e] to-[#f72585]",
              },
              {
                icon: "fa-gift",
                title: "Claim Rewards",
                desc: "Redeem your points",
                href: "/rewards",
                color: "from-[#4cc9f0] to-[#4361ee]",
              },
              {
                icon: "fa-user",
                title: "Edit Profile",
                desc: "Update your info",
                href: "/profile",
                color: "from-[#4361ee] to-[#3a0ca3]",
              },
              {
                icon: "fa-chart-line",
                title: "View Progress",
                desc: "Track your stats",
                href: "/profile",
                color: "from-[#4cc9f0] to-[#00b4d8]",
              },
            ].map((action, i) => (
              <a
                key={i}
                href={action.href}
                className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition`}
                >
                  <i className={`fas ${action.icon} text-white text-xl`}></i>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="fas fa-clock text-[#4361ee]"></i>
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f172a] transition"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: activity.icon_color || '#4361ee' }}>
                    <i className={`fas ${activity.icon || 'fa-clock'} text-white`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{activity.title || activity.description}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
