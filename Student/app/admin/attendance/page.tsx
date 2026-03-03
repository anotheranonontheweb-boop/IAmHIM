"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AttendanceRecord {
  id: number
  student_name: string
  grade: string
  scanned_at: string
  status: string
  absent_reason?: string | null
  absence_type?: string | null
}

export default function AdminAttendancePage() {
  const router = useRouter()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sections, setSections] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editStatus, setEditStatus] = useState("")

  useEffect(() => {
    const checkAuth = () => {
      const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : ""
      if (userRole !== "admin") router.push("/")
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    fetchRecords()
  }, [])

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch("/api/admin/sections")
        const data = await response.json()
        if (data.sections) {
          setSections(data.sections.map((s: { section_name: string }) => s.section_name))
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error)
      }
    }
    fetchSections()
  }, [])

  useEffect(() => {
    let filtered = records
    if (dateFilter) {
      filtered = filtered.filter((r) => r.scanned_at.startsWith(dateFilter))
    }
    if (sectionFilter) {
      filtered = filtered.filter((r) => r.grade === sectionFilter)
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }
    if (searchQuery) {
      filtered = filtered.filter((r) => r.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    setFilteredRecords(filtered)
  }, [dateFilter, sectionFilter, statusFilter, searchQuery, records])

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/teacher/attendance")
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
        body: JSON.stringify({ recordId: editingRecord.id, status: editStatus }),
      })
      const data = await response.json()
      if (data.success) {
        setRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? { ...r, status: editStatus } : r)))
        setEditingRecord(null)
      }
    } catch (error) {
      console.error("Failed to update record:", error)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  // Calculate stats
  const presentCount = filteredRecords.filter((r) => r.status === "present").length
  const lateCount = filteredRecords.filter((r) => r.status === "late").length
  const absentCount = filteredRecords.filter((r) => r.status === "absent").length

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/admin")} className="text-[#4361ee] hover:opacity-80">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <i className="fas fa-clipboard-list text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Monitoring</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        {/* Filters */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Student</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Section</label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
              >
                <option value="">All Sections</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => {
                setDateFilter("")
                setSectionFilter("")
                setStatusFilter("all")
                setSearchQuery("")
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:opacity-90"
            >
              Clear Filters
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredRecords.length} of {records.length} records
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0f172a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{record.student_name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{record.grade}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(record.scanned_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(record.scanned_at).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present' ? 'bg-green-100 text-green-800' : record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {record.status === 'absent' && record.absence_type && (
                          <span className={record.absence_type === 'excused' ? 'text-green-600' : 'text-red-600'}>
                            {record.absence_type === 'excused' ? 'E' : 'U'}-
                          </span>
                        )}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <button onClick={() => handleEdit(record)} className="text-[#4361ee] hover:text-[#3a0ca3]">
                        <i className="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {editingRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Attendance</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white">
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={saveEdit} className="flex-1 bg-[#4361ee] text-white py-2 rounded-lg hover:opacity-90">Save</button>
                <button onClick={() => setEditingRecord(null)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
