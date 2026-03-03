"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "@/lib/theme-context"

interface UserStats {
  streak: number
  points: number
  total_points: number
  class_rank: number
  total_rank: number
}

interface AttendanceStats {
  total: number
  present: number
  late: number
  absent: number
  attendanceRate: number
}

export default function StudentDashboard() {
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  const [userName, setUserName] = useState("Student")
  const [stats, setStats] = useState<UserStats | null>(null)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const userRole = localStorage.getItem("userRole")
        const userId = localStorage.getItem("userId")

        if (!userId || userRole !== "student") {
          router.push("/")
          return false
        }
        return true
      }
      return false
    }

    if (checkAuth()) {
      fetchData()
    }
  }, [router])

  const fetchData = async () => {
    try {
      const userId = localStorage.getItem("userId")
      const name = localStorage.getItem("username")
      setUserName(name || "Student")

      // Fetch user stats
      const statsRes = await fetch(`/api/user/stats?userId=${userId}`)
      const statsData = await statsRes.json()
      setStats(statsData.stats)

      // Fetch attendance stats
      const attendanceRes = await fetch(`/api/attendance/stats?userId=${userId}`)
      const attendanceData = await attendanceRes.json()
      setAttendanceStats(attendanceData.stats)

      // Fetch recent activity from both sources
      let allActivities: any[] = []
      
      const recentRes = await fetch(`/api/recent-activities?userId=${userId}`)
      if (recentRes.ok) {
        const recentData = await recentRes.json()
        allActivities = [...(recentData?.activities || [])]
      }
      
      // Also fetch from activities table
      const activityRes = await fetch(`/api/activities?userId=${userId}`)
      if (activityRes.ok) {
        const activityData = await activityRes.json()
        // Combine both activity sources
        allActivities = [
          ...allActivities,
          ...(activityData?.activities || [])
        ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
      }
      setRecentActivity(allActivities)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userId")
      localStorage.removeItem("username")
      localStorage.removeItem("userFullName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userRole")
      localStorage.removeItem("userPoints")
      localStorage.removeItem("userSection")
    }
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee] mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your data...</p>
        </div>
      </div>
    )
  }

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : ""
  const userSection = typeof window !== "undefined" ? localStorage.getItem("userSection") || "10-A" : "10-A"

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 text-[#4361ee]">
              <i className="fas fa-graduation-cap text-3xl"></i>
              <h1 className="text-2xl font-bold">EduTrack Pro</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-semibold text-gray-900 dark:text-white">{userName}</span>
              </span>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0f172a] transition"
                title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              >
                {isDarkMode ? (
                  <i className="fas fa-sun text-yellow-500"></i>
                ) : (
                  <i className="fas fa-moon text-gray-600"></i>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}! 👋</h1>
              <p className="text-white/90">Section: {userSection}</p>
            </div>
            <div className="text-center bg-white/20 rounded-xl px-8 py-4">
              <div className="text-4xl font-bold">{stats?.streak || 0}</div>
              <div className="text-sm opacity-90">Day Streak 🔥</div>
            </div>
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{attendanceStats?.attendanceRate || 100}%</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center">
                <i className="fas fa-percentage text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Present</p>
                <p className="text-3xl font-bold text-green-600">{attendanceStats?.present || 0}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Late</p>
                <p className="text-3xl font-bold text-yellow-600">{attendanceStats?.late || 0}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#eab308] to-[#ca8a04] rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Absent</p>
                <p className="text-3xl font-bold text-red-600">{attendanceStats?.absent || 0}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-full flex items-center justify-center">
                <i className="fas fa-times text-white text-2xl"></i>
              </div>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.class_rank || "-"}</p>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_rank || "-"}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#4cc9f0] to-[#00b4d8] rounded-full flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-2xl"></i>
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
            <Link
              href="/student/qr"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-qrcode text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">My QR Code</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Download your attendance QR</p>
            </Link>

            <Link
              href="/student/history"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-history text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Attendance History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View your attendance record</p>
            </Link>

            <Link
              href="/student/profile"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#f8961e] to-[#f72585] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-user text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Edit Profile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your information</p>
            </Link>

            <Link
              href="/leaderboard"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#4cc9f0] to-[#00b4d8] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-trophy text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Leaderboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Check rankings</p>
            </Link>

            <Link
              href="/student/rewards"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#f72585] to-[#b5179e] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-gift text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Rewards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Redeem points</p>
            </Link>
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
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f172a] transition">
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
