"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "@/lib/theme-context"

interface TeacherStats {
  totalStudents: number
  presentToday: number
  lateToday: number
  absentToday: number
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const userRole = localStorage.getItem("userRole")
        const userId = localStorage.getItem("userId")

        if (!userId || (userRole !== "teacher" && userRole !== "admin")) {
          router.push("/")
          return false
        }
        return true
      }
      return false
    }

    if (checkAuth()) {
      fetchDashboardData()
    }
  }, [router])

  const fetchDashboardData = async () => {
    try {
      // Fetch teacher's assigned section students
      const userId = localStorage.getItem("userId")
      const section = localStorage.getItem("userSection")

      // For demo, use section 10-A
      const sectionId = section || "10-A"

      // Fetch all students in section
      const studentsRes = await fetch(`/api/teacher/students?section=${sectionId}`)
      const studentsData = await studentsRes.json()

      // Fetch today's attendance
      const today = new Date().toISOString().split("T")[0]
      const attendanceRes = await fetch(`/api/teacher/attendance?date=${today}&section=${sectionId}`)
      const attendanceData = await attendanceRes.json()

      const students = studentsData.students || []
      const attendance = attendanceData.records || []

      // Calculate stats
      const present = attendance.filter((r: any) => r.status === "present").length
      const late = attendance.filter((r: any) => r.status === "late").length
      const absent = students.length - present - late

      setStats({
        totalStudents: students.length,
        presentToday: present,
        lateToday: late,
        absentToday: Math.max(0, absent),
      })

      // Fetch recent activity
      const activityRes = await fetch("/api/activities")
      const activityData = await activityRes.json()
      setRecentActivity(activityData.activities?.slice(0, 5) || [])
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
      localStorage.removeItem("userSection")
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

  const teacherName = typeof window !== "undefined" ? localStorage.getItem("username") || "Teacher" : "Teacher"
  const subject = typeof window !== "undefined" ? localStorage.getItem("subject") || "General" : "General"

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <i className="fas fa-chalkboard-teacher text-3xl text-[#4361ee]"></i>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Teacher Portal</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{subject} Teacher</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-semibold text-gray-900 dark:text-white">{teacherName}</span>
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
              <h1 className="text-3xl font-bold mb-2">Welcome back, {teacherName}! 👋</h1>
              <p className="text-white/90">Here's your class attendance summary for today</p>
            </div>
            <div className="text-center bg-white/20 rounded-xl px-6 py-3">
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <div className="text-sm opacity-90">Total Students</div>
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
                <i className="fas fa-users text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Late Today</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.lateToday}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#eab308] to-[#ca8a04] rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{stats.absentToday}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-full flex items-center justify-center">
                <i className="fas fa-times text-white text-2xl"></i>
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
              href="/teacher/scan"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-qrcode text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Start Attendance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Scan QR codes</p>
            </Link>

            <Link
              href="/teacher/records"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-clipboard-list text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">View Records</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Attendance history</p>
            </Link>

            <Link
              href="/teacher/attendance"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#f8961e] to-[#f72585] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-clipboard-check text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Class Attendance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mark attendance</p>
            </Link>

            <Link
              href="/teacher/profile"
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#4cc9f0] to-[#00b4d8] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i className="fas fa-user text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Profile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage account</p>
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
