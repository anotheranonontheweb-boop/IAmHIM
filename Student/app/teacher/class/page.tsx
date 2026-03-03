"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Student {
  id: number
  name: string
  email: string
  grade: string
  avatar: string
  section_id: string
}

interface StudentStats {
  totalAbsences: number
  totalLates: number
  attendancePercentage: number
}

export default function TeacherClassPage() {
  const router = useRouter()
  const [students, setStudents] = useState<(Student & StudentStats)[]>([])
  const [loading, setLoading] = useState(true)

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
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const section = localStorage.getItem("userSection") || "10-A"
      const response = await fetch(`/api/teacher/students?section=${section}`)
      const data = await response.json()
      const studentsData = data.students || []

      // Fetch attendance stats for each student
      const studentsWithStats = await Promise.all(
        studentsData.map(async (student: Student) => {
          try {
            const attendanceRes = await fetch(`/api/teacher/attendance?section=${student.grade}`)
            const attendanceData = await attendanceRes.json()
            const records = attendanceData.records || []
            const studentRecords = records.filter((r: any) => r.user_id === student.id)

            const absent = studentRecords.filter((r: any) => r.status === "absent").length
            const late = studentRecords.filter((r: any) => r.status === "late").length
            const present = studentRecords.filter((r: any) => r.status === "present").length
            const total = studentRecords.length

            return {
              ...student,
              totalAbsences: absent,
              totalLates: late,
              attendancePercentage: total > 0 ? Math.round(((present + late) / total) * 100) : 100,
            }
          } catch {
            return {
              ...student,
              totalAbsences: 0,
              totalLates: 0,
              attendancePercentage: 100,
            }
          }
        })
      )

      setStudents(studentsWithStats)
    } catch (error) {
      console.error("Failed to fetch students:", error)
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
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading class list...</p>
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
              <i className="fas fa-users-class text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Class List</h1>
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
        {/* Class Info */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Section {localStorage.getItem("userSection") || "10-A"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Total Students: <span className="font-semibold">{students.length}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0f172a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Absences
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Lates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Attendance %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] flex items-center justify-center text-white font-bold">
                            {student.avatar || student.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-red-600 font-medium">{student.totalAbsences}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-yellow-600 font-medium">{student.totalLates}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.attendancePercentage >= 90
                                  ? "bg-green-500"
                                  : student.attendancePercentage >= 75
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${student.attendancePercentage}%` }}
                            ></div>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              student.attendancePercentage >= 90
                                ? "text-green-600"
                                : student.attendancePercentage >= 75
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {student.attendancePercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No students found in this section
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
