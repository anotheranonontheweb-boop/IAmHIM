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

export default function AdminStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [sections, setSections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    grade: "",
    section_id: "",
  })

  useEffect(() => {
    const checkAuth = () => {
      const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : ""
      if (userRole !== "admin") {
        router.push("/")
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const [studentsRes, sectionsRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/sections")
      ])
      const studentsData = await studentsRes.json()
      const sectionsData = await sectionsRes.json()
      setStudents(studentsData.students || [])
      setSections(sectionsData.sections?.map((s: { section_name: string }) => s.section_name) || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingStudent ? "PUT" : "POST"
      const body = editingStudent
        ? { id: editingStudent.id, ...formData }
        : formData

      const response = await fetch("/api/admin/students", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success || data.student) {
        fetchStudents()
        setShowModal(false)
        setEditingStudent(null)
        setFormData({ name: "", email: "", password: "", grade: "10-A", section_id: "10-A" })
      }
    } catch (error) {
      console.error("Failed to save student:", error)
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      email: student.email,
      password: "",
      grade: student.grade,
      section_id: student.section_id || student.grade,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return
    try {
      await fetch(`/api/admin/students?id=${id}`, { method: "DELETE" })
      fetchStudents()
    } catch (error) {
      console.error("Failed to delete student:", error)
    }
  }

  const generateQRCode = (studentId: number) => {
    const qrData = `STU:${studentId}:SCHOOL2024`
    alert(`Student QR Code Data: ${qrData}\n\nThis will be used to generate a printable QR code.`)
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/admin")} className="text-[#4361ee] hover:opacity-80">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <i className="fas fa-user-graduate text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manage Students</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Students ({students.length})</h2>
          <button
            onClick={() => {
              setEditingStudent(null)
              setFormData({ name: "", email: "", password: "", grade: "10-A", section_id: "10-A" })
              setShowModal(true)
            }}
            className="bg-[#4361ee] text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            <i className="fas fa-plus mr-2"></i>Add Student
          </button>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0f172a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] flex items-center justify-center text-white font-bold">
                        {student.avatar || student.name.charAt(0)}
                      </div>
                      <span className="ml-3 font-medium text-gray-900 dark:text-white">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{student.email}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{student.section_id || student.grade}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => generateQRCode(student.id)} className="text-blue-500 hover:text-blue-700 mr-3">
                      <i className="fas fa-qrcode"></i>
                    </button>
                    <button onClick={() => handleEdit(student)} className="text-[#4361ee] hover:text-[#3a0ca3] mr-3">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="text-red-500 hover:text-red-700">
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingStudent ? "Edit Student" : "Add Student"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password {editingStudent && "(leave blank to keep)"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                    required={!editingStudent}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section</label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value, grade: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-[#4361ee] text-white py-2 rounded-lg hover:opacity-90">
                    {editingStudent ? "Update" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
