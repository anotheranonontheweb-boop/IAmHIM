"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "@/lib/theme-context"

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalSections: number
  todayAttendance: {
    present: number
    late: number
    absent: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSections: 0,
    todayAttendance: { present: 0, late: 0, absent: 0 },
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [pointSettings, setPointSettings] = useState({ present: 10, late: 5 })
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const userRole = localStorage.getItem("userRole")
        const userId = localStorage.getItem("userId")

        if (!userId || userRole !== "admin") {
          router.push("/")
        }
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch total students
      const studentsRes = await fetch("/api/admin/stats")
      const studentsData = await studentsRes.json()

      // Fetch total teachers
      const teachersRes = await fetch("/api/admin/teachers")
      const teachersData = await teachersRes.json()

      // Fetch sections
      const sectionsRes = await fetch("/api/admin/sections")
      const sectionsData = await sectionsRes.json()

      // Fetch today's attendance
      const today = new Date().toISOString().split("T")[0]
      const attendanceRes = await fetch(`/api/teacher/attendance?date=${today}`)
      const attendanceData = await attendanceRes.json()

      const records = attendanceData.records || []
      // Count late as present since they're already in school
      const present = records.filter((r: any) => r.status === "present" || r.status === "late").length
      const late = records.filter((r: any) => r.status === "late").length
      const absent = records.filter((r: any) => r.status === "absent").length

      setStats({
        totalStudents: studentsData.total || 0,
        totalTeachers: teachersData.teachers?.length || 0,
        totalSections: sectionsData.sections?.length || 0,
        todayAttendance: { present, late, absent },
      })

      // Fetch recent activity
      const activityRes = await fetch("/api/activities")
      const activityData = await activityRes.json()
      setRecentActivity(activityData.activities?.slice(0, 5) || [])

      // Fetch point settings
      try {
        const settingsRes = await fetch("/api/admin/settings")
        const settingsData = await settingsRes.json()
        if (Array.isArray(settingsData)) {
          const present = settingsData.find((s: any) => s.key === 'present_points')
          const late = settingsData.find((s: any) => s.key === 'late_points')
          setPointSettings({
            present: present ? parseInt(present.value) : 10,
            late: late ? parseInt(late.value) : 5
          })
        }
      } catch (e) {
        // Use defaults if settings not available
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
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
    }
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee] mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const adminName = typeof window !== "undefined" ? localStorage.getItem("username") || "Admin" : "Admin"

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <i className="fas fa-user-shield text-3xl text-[#4361ee]"></i>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">System Administrator</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-semibold text-gray-900 dark:text-white">{adminName}</span>
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
              <h1 className="text-3xl font-bold mb-2">Welcome back, {adminName}! 👋</h1>
              <p className="text-white/90">Here's your school attendance overview</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-full flex items-center justify-center">
                <i className="fas fa-user-graduate text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTeachers}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#f8961e] to-[#f72585] rounded-full flex items-center justify-center">
                <i className="fas fa-chalkboard-teacher text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.todayAttendance.present}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{stats.todayAttendance.absent}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-full flex items-center justify-center">
                <i className="fas fa-times text-white text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Distribute Points Button */}
        <div className="mb-8">
          <button
            onClick={async () => {
              if (!confirm(`Distribute points for yesterday's attendance?\n\n- Present: ${pointSettings.present} points\n- Late: ${pointSettings.late} points\n\nThis will add points to all students who attended yesterday.`)) return
              
              setDistributing(true)
              try {
                const res = await fetch("/api/admin/points/calculate", { method: "POST" })
                const data = await res.json()
                if (data.success) {
                  alert(`Points distributed!\n${data.students_processed} students received points.`)
                } else {
                  alert("Error: " + data.error)
                }
              } catch (err) {
                alert("Failed to distribute points")
              } finally {
                setDistributing(false)
              }
            }}
            disabled={distributing}
            className="w-full py-4 bg-gradient-to-r from-[#f8961e] to-[#fbbf24] text-white rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            <i className={`fas fa-coins mr-2 ${distributing ? 'animate-spin' : ''}`}></i>
            {distributing ? 'Distributing Points...' : '📤 Distribute Daily Points (12PM)'}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Click to give points to students based on yesterday's attendance (Present: {pointSettings.present}pts, Late: {pointSettings.late}pts)
          </p>
        </div>

        {/* Point Settings */}
        <div className="mb-8 bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="fas fa-cog text-[#4361ee]"></i>
            Point System Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points for Present
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={pointSettings.present}
                onChange={(e) => setPointSettings({ ...pointSettings, present: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4361ee] dark:bg-[#0f172a] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points for Late
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={pointSettings.late}
                onChange={(e) => setPointSettings({ ...pointSettings, late: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4361ee] dark:bg-[#0f172a] dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={async () => {
              setSavingSettings(true)
              try {
                // Save present points
                await fetch("/api/admin/settings", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ key: "present_points", value: pointSettings.present })
                })
                // Save late points
                await fetch("/api/admin/settings", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ key: "late_points", value: pointSettings.late })
                })
                alert("Point settings saved!")
              } catch (err) {
                alert("Failed to save settings")
              } finally {
                setSavingSettings(false)
              }
            }}
            disabled={savingSettings}
            className="mt-4 px-6 py-2 bg-[#4361ee] text-white rounded-lg hover:bg-[#3451db] transition disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Save Point Settings'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <i className="fas fa-bolt text-[#4361ee]"></i>
            Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/students"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-user-graduate text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manage Students</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add, edit, delete students</p>
            </Link>

            <Link
              href="/admin/teachers"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#f8961e] to-[#f72585] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-chalkboard-teacher text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manage Teachers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add, edit, delete teachers</p>
            </Link>

            <Link
              href="/admin/attendance"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#4cc9f0] to-[#00b4d8] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-clipboard-list text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Attendance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View and monitor attendance</p>
            </Link>

            <Link
              href="/admin/redeem"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#f8961e] to-[#fbbf24] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-gift text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Reward Redemptions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending reward requests</p>
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
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f172a] transition"
                >
                  <div className="w-10 h-10 bg-[#4361ee] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-calendar-check text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{activity.description}</p>
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
