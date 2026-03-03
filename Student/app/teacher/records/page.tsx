"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AttendanceRecord {
  id: number
  session_id: number
  user_id: number
  student_name: string
  grade: string
  scanned_at: string
  status: string
  scan_method: string
  absent_reason?: string | null
  absence_type?: string | null
}

export default function TeacherRecordsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editStatus, setEditStatus] = useState("")

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const userRole = localStorage.getItem("userRole")
        const userId = localStorage.getItem("userId")

        if (!userId || (userRole !== "teacher" && userRole !== "admin")) {
          router.push("/")
        }
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    fetchRecords()
  }, [])

  useEffect(() => {
    const filtered = records.filter((r) => {
      // Date filter
      const matchesDate = dateFilter ? r.scanned_at.startsWith(dateFilter) : true
      // Status filter
      const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter
      // Search filter
      const matchesSearch = searchQuery 
        ? r.student_name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      
      return matchesDate && matchesStatus && matchesSearch
    })
    setFilteredRecords(filtered)
  }, [dateFilter, statusFilter, searchQuery, records])

  const fetchRecords = async () => {
    try {
      const section = localStorage.getItem("userSection") || "10-A"
      const response = await fetch(`/api/teacher/attendance?section=${section}`)
      const data = await response.json()
      setRecords(data.records || [])
      setFilteredRecords(data.records || [])
    } catch (error) {
      console.error("Failed to fetch records:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setEditStatus(record.status)
  }

  const saveEdit = async () => {
    if (!editingRecord) return

    try {
      const response = await fetch("/api/teacher/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: editingRecord.id,
          status: editStatus,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRecords((prev) =>
          prev.map((r) => (r.id === editingRecord.id ? { ...r, status: editStatus } : r))
        )
        setEditingRecord(null)
      }
    } catch (error) {
      console.error("Failed to update record:", error)
    }
  }

  const handleDelete = async (recordId: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const response = await fetch(`/api/teacher/attendance?id=${recordId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setRecords((prev) => prev.filter((r) => r.id !== recordId))
      }
    } catch (error) {
      console.error("Failed to delete record:", error)
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
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/teacher")} className="text-[#4361ee] hover:opacity-80">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <i className="fas fa-clipboard-list text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Records</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Student
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4361ee] focus:border-transparent outline-none"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4361ee] focus:border-transparent outline-none"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4361ee] focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateFilter("")
                  setStatusFilter("all")
                  setSearchQuery("")
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:opacity-90 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredRecords.length} of {records.length} records
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0f172a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {record.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(record.scanned_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(record.scanned_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === "present"
                              ? "bg-green-100 text-green-800"
                              : record.status === "late"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.status === 'absent' && record.absence_type && (
                            <span className={record.absence_type === 'excused' ? 'text-green-600' : 'text-red-600'}>
                              {record.absence_type === 'excused' ? 'E' : 'U'}-
                            </span>
                          )}
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.status === 'absent' ? (
                          <div className="text-sm">
                            {record.absent_reason ? (
                              <span className="text-gray-900 dark:text-white">{record.absent_reason}</span>
                            ) : (
                              <span className="text-gray-400 italic">No reason</span>
                            )}
                            {record.absence_type && (
                              <div className="mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${record.absence_type === 'excused' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {record.absence_type === 'excused' ? 'Excused' : 'Unexcused'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-[#4361ee] hover:text-[#3a0ca3] mr-3"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Attendance</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4361ee] focus:border-transparent outline-none"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-[#4361ee] text-white py-2 rounded-lg hover:opacity-90 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:opacity-90 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
