"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AttendanceRecord {
  id: number
  student_name: string
  grade: string
  scanned_at: string
  status: string
}

export default function StudentHistoryPage() {
  const router = useRouter()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

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
    checkAuth()
  }, [router])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const userId = localStorage.getItem("userId")
      const response = await fetch(`/api/attendance/history?userId=${userId}`)
      const data = await response.json()
      setRecords(data.records || [])
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  // Calculate stats
  const presentCount = records.filter((r) => r.status === "present").length
  const lateCount = records.filter((r) => r.status === "late").length
  const absentCount = records.filter((r) => r.status === "absent").length
  const total = records.length
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 100

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/student")} className="text-[#4361ee] hover:opacity-80">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <i className="fas fa-history text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Attendance History</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Attendance Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceRate}%</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Present</p>
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Late</p>
            <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Absent</p>
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0f172a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {new Date(record.scanned_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(record.scanned_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === "present"
                            ? "bg-green-100 text-green-800"
                            : record.status === "late"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
