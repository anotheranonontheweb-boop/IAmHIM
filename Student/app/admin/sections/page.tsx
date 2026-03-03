"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Section {
  id: number
  section_name: string
  grade_level: string
  adviser_id: number | null
  is_active: boolean
}

interface Teacher {
  id: number
  name: string
}

export default function AdminSectionsPage() {
  const router = useRouter()
  const [sections, setSections] = useState<Section[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ section_name: "", grade_level: "Grade 10", adviser_id: "" })

  useEffect(() => {
    const checkAuth = () => {
      const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : ""
      if (userRole !== "admin") router.push("/")
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sectionsRes, teachersRes] = await Promise.all([
        fetch("/api/admin/sections"),
        fetch("/api/admin/teachers"),
      ])
      const sectionsData = await sectionsRes.json()
      const teachersData = await teachersRes.json()
      setSections(sectionsData.sections || [])
      setTeachers(teachersData.teachers || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, adviser_id: formData.adviser_id ? parseInt(formData.adviser_id) : null }),
      })
      const data = await response.json()
      if (data.success || data.section) {
        fetchData()
        setShowModal(false)
        setFormData({ section_name: "", grade_level: "Grade 10", adviser_id: "" })
      }
    } catch (error) {
      console.error("Failed to create section:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this section?")) return
    try {
      await fetch(`/api/admin/sections?id=${id}`, { method: "DELETE" })
      fetchData()
    } catch (error) {
      console.error("Failed to delete section:", error)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  const getAdviserName = (adviserId: number | null) => {
    if (!adviserId) return "Not assigned"
    const teacher = teachers.find((t) => t.id === adviserId)
    return teacher?.name || "Unknown"
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
              <i className="fas fa-school text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manage Sections</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sections ({sections.length})</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#4361ee] text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            <i className="fas fa-plus mr-2"></i>Create Section
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div key={section.id} className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{section.section_name}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{section.grade_level}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${section.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {section.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Adviser: <span className="text-gray-900 dark:text-white">{getAdviserName(section.adviser_id)}</span></p>
              </div>
              <button onClick={() => handleDelete(section.id)} className="text-red-500 hover:text-red-700">
                <i className="fas fa-trash mr-1"></i>Delete
              </button>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Section</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section Name</label>
                  <input
                    type="text"
                    value={formData.section_name}
                    onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                    placeholder="e.g., 10-A"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grade Level</label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                  >
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign Adviser</label>
                  <select
                    value={formData.adviser_id}
                    onChange={(e) => setFormData({ ...formData, adviser_id: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                  >
                    <option value="">Select Adviser</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-[#4361ee] text-white py-2 rounded-lg hover:opacity-90">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">
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
