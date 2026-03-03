"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Student {
  id: number
  name: string
  email: string
  grade: string
  section_id: string
}

interface AttendanceRecord {
  id: number
  session_id: number
  user_id: number
  student_name: string
  grade: string
  scanned_at: string
  scan_method: string
  status: "present" | "late" | "absent"
}

export default function TeacherAttendancePage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Absent reason modal states
  const [showAbsentModal, setShowAbsentModal] = useState(false)
  const [absentStudent, setAbsentStudent] = useState<{id: number, name: string, grade: string} | null>(null)
  const [absentReason, setAbsentReason] = useState("")
  const [absenceType, setAbsenceType] = useState<"excused" | "unexcused">("unexcused")

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

  const fetchData = async () => {
    try {
      const section = localStorage.getItem("userSection") || "10-A"
      
      // Fetch students
      const studentsRes = await fetch(`/api/teacher/students?section=${section}`)
      const studentsData = await studentsRes.json()
      setStudents(studentsData.students || [])

      // Fetch today's attendance records
      const today = new Date().toISOString().split("T")[0]
      const recordsRes = await fetch(`/api/attendance/history?date=${today}`)
      const recordsData = await recordsRes.json()
      setAttendanceRecords(recordsData.records || [])
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setErrorMessage(message)
      setTimeout(() => setErrorMessage(""), 3000)
    } else {
      setSuccessMessage(message)
      setTimeout(() => setSuccessMessage(""), 3000)
    }
  }

  const markAttendance = async (studentId: number, studentName: string, grade: string, status: "present" | "late" | "absent", absentReasonData?: string, absenceTypeData?: string) => {
    setSaving(studentId)
    
    try {
      // Get current session or create one
      let currentSessionId = sessionId
      
      if (!currentSessionId) {
        // Create a session if none exists
        const section = localStorage.getItem("userSection") || "10-A"
        const teacherId = localStorage.getItem("userId")
        
        const sessionRes = await fetch("/api/attendance/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionName: `Attendance - ${new Date().toLocaleDateString()}`,
            sectionId: section,
            createdBy: teacherId,
          }),
        })
        const sessionData = await sessionRes.json()
        currentSessionId = sessionData.session?.id || 1
        setSessionId(currentSessionId)
      }

      // Check if record already exists for today
      const today = new Date().toISOString().split("T")[0]
      const existingRecord = attendanceRecords.find(
        r => r.user_id === studentId && r.scanned_at.startsWith(today)
      )

      if (existingRecord) {
        // Update existing record using POST (since PUT seems to have issues)
        const response = await fetch("/api/teacher/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updateId: existingRecord.id,
            status: status,
            absentReason: status === "absent" ? absentReasonData : null,
            absenceType: status === "absent" ? absenceTypeData : null,
          }),
        })

        const data = await response.json()
        
        if (data.success) {
          // Refresh records
          await fetchData()
          showMessage(`${studentName} updated to ${status}!`)
        } else {
          showMessage(data.error || "Failed to update attendance", true)
        }
      } else {
        // Create new record
        const response = await fetch("/api/teacher/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessionId,
            userId: studentId,
            studentName: studentName,
            grade: grade,
            status: status,
            scanMethod: "manual",
            absentReason: status === "absent" ? absentReasonData : null,
            absenceType: status === "absent" ? absenceTypeData : null,
          }),
        })

        const data = await response.json()
        
        if (data.success || data.message?.includes("already") || data.updated) {
          await fetchData()
          showMessage(`${studentName} marked as ${status}!`)
        } else {
          showMessage(data.error || "Failed to mark attendance", true)
        }
      }
    } catch (err) {
      console.error("Attendance error:", err)
      showMessage("Failed to mark attendance", true)
    } finally {
      setSaving(null)
    }
  }

  // Handle opening the absent reason modal
  const handleAbsentClick = (studentId: number, studentName: string, grade: string) => {
    setAbsentStudent({ id: studentId, name: studentName, grade })
    setAbsentReason("")
    setAbsenceType("unexcused")
    setShowAbsentModal(true)
  }

  // Submit absent with reason
  const submitAbsentWithReason = async () => {
    if (!absentStudent) return
    
    setShowAbsentModal(false)
    await markAttendance(absentStudent.id, absentStudent.name, absentStudent.grade, "absent", absentReason, absenceType)
    setAbsentStudent(null)
  }

  const markAllPresent = async () => {
    if (!confirm(`Mark all ${students.length} students as present?`)) {
      return
    }
    
    setLoading(true)
    
    try {
      // Get or create a session first
      const section = localStorage.getItem("userSection") || "10-A"
      const teacherId = localStorage.getItem("userId")
      const today = new Date().toISOString().split("T")[0]
      
      // Create or get session
      const sessionRes = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: `Attendance - ${today}`,
          sectionId: section,
          createdBy: teacherId,
        })
      })
      const sessionData = await sessionRes.json()
      const currentSessionId = sessionData.session?.id || 1
      
      let successCount = 0
      
      // Mark each student as present
      for (const student of students) {
        try {
          // Create new record
          const response = await fetch("/api/teacher/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: currentSessionId,
              userId: student.id,
              studentName: student.name,
              grade: student.grade || section,
              status: "present",
              scanMethod: "manual",
            }),
          })
          
          const data = await response.json()
          if (data.success || data.updated || data.message?.includes("already") || data.message?.includes("updated")) {
            successCount++
          } else if (data.error) {
            console.error(`Error for ${student.name}:`, data.error)
          }
        } catch (err) {
          console.error(`Error marking ${student.name}:`, err)
        }
      }
      
      await fetchData()
      showMessage(`${successCount} students marked as present!`)
    } catch (err) {
      console.error("Error marking all present:", err)
      showMessage("Failed to mark all present", true)
    } finally {
      setLoading(false)
    }
  }

  const getStudentStatus = (studentId: number): { status: string | null; time: string | null; record: AttendanceRecord | null } => {
    const today = new Date().toISOString().split("T")[0]
    const record = attendanceRecords.find(
      r => r.user_id === studentId && r.scanned_at.startsWith(today)
    )
    
    if (record) {
      return {
        status: record.status,
        time: new Date(record.scanned_at).toLocaleTimeString(),
        record: record
      }
    }
    return { status: null, time: null, record: null }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "late":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "absent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
    }
  }

  const getStatusBtnColor = (currentStatus: string | null, btnStatus: string) => {
    if (currentStatus === btnStatus) {
      switch (btnStatus) {
        case "present":
          return "bg-green-500 text-white"
        case "late":
          return "bg-yellow-500 text-white"
        case "absent":
          return "bg-red-500 text-white"
        default:
          return "bg-[#4361ee] text-white"
      }
    }
    return "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  // Filter students by search query and status
  const filteredStudents = students.filter((student) => {
    const { status } = getStudentStatus(student.id)
    
    // Search filter
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Status filter
    let matchesStatus = true
    if (statusFilter === "present") {
      matchesStatus = status === "present"
    } else if (statusFilter === "late") {
      matchesStatus = status === "late"
    } else if (statusFilter === "absent") {
      matchesStatus = status === "absent" || status === null
    } else if (statusFilter === "not_marked") {
      matchesStatus = status === null
    }
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee] mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading students...</p>
        </div>
      </div>
    )
  }

  const presentCount = students.filter(s => {
    const today = new Date().toISOString().split("T")[0]
    const record = attendanceRecords.find(r => r.user_id === s.id && r.scanned_at.startsWith(today))
    return record?.status === "present"
  }).length
  
  const lateCount = students.filter(s => {
    const today = new Date().toISOString().split("T")[0]
    const record = attendanceRecords.find(r => r.user_id === s.id && r.scanned_at.startsWith(today))
    return record?.status === "late"
  }).length
  
  const absentCount = students.length - presentCount - lateCount

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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Class Attendance</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            {errorMessage}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#4361ee]/10 rounded-full flex items-center justify-center">
                <i className="fas fa-users text-[#4361ee] text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <i className="fas fa-times text-red-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-clipboard-check mr-2 text-[#4361ee]"></i>
              Today's Attendance - {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="not_marked">Not Marked</option>
              </select>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredStudents.length} of {students.length} students
              </span>
              {students.length > 0 && (
                <button
                  onClick={markAllPresent}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-check-double"></i>
                  Set All to Present
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0f172a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time Logged
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student) => {
                  const { status, time } = getStudentStatus(student.id)
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-[#0f172a] transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.grade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-white font-mono">#{student.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status ? status.toUpperCase() : "NOT MARKED"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {time ? (
                          <span className="text-gray-900 dark:text-white">{time}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => markAttendance(student.id, student.name, student.grade, "present")}
                            disabled={saving === student.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${getStatusBtnColor(status, "present")} ${
                              saving === student.id ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, student.name, student.grade, "late")}
                            disabled={saving === student.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${getStatusBtnColor(status, "late")} ${
                              saving === student.id ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleAbsentClick(student.id, student.name, student.grade)}
                            disabled={saving === student.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${getStatusBtnColor(status, "absent")} ${
                              saving === student.id ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="py-12 text-center">
                <i className="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || statusFilter !== "all" 
                    ? "No students match your search or filter criteria" 
                    : "No students found"}
                </p>
              </div>
            )}
          </div>
          
          {students.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-users text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <p className="text-gray-500 dark:text-gray-400">No students found in your section</p>
            </div>
          )}
        </div>
      </main>

      {/* Absent Reason Modal */}
      {showAbsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              <i className="fas fa-user-times mr-2 text-red-500"></i>
              Mark Absent - {absentStudent?.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Absence Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="absenceType"
                      value="excused"
                      checked={absenceType === "excused"}
                      onChange={(e) => setAbsenceType(e.target.value as "excused" | "unexcused")}
                      className="mr-2"
                    />
                    <span className="text-green-600 font-medium">
                      <i className="fas fa-check-circle mr-1"></i>Excused
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="absenceType"
                      value="unexcused"
                      checked={absenceType === "unexcused"}
                      onChange={(e) => setAbsenceType(e.target.value as "excused" | "unexcused")}
                      className="mr-2"
                    />
                    <span className="text-red-600 font-medium">
                      <i className="fas fa-times-circle mr-1"></i>Unexcused
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Absence (Optional)
                </label>
                <textarea
                  value={absentReason}
                  onChange={(e) => setAbsentReason(e.target.value)}
                  placeholder="Enter reason for absence..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={submitAbsentWithReason}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
              >
                <i className="fas fa-save mr-2"></i>
                Mark Absent
              </button>
              <button
                onClick={() => setShowAbsentModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:opacity-90 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
