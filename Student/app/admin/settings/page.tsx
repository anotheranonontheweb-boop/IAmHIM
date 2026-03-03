"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Section {
  id: number
  item_name: string
  item_value: string
  item_order: number
}

interface Setting {
  id: number
  key_name: string
  key_value: string
  description: string
}

interface SchoolInfo {
  id: number
  key_name: string
  key_value: string
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"sections" | "settings" | "school">("sections")
  const [sections, setSections] = useState<Section[]>([])
  const [settings, setSettings] = useState<Setting[]>([])
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : ""
    if (userRole !== "admin") {
      router.push("/")
    }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/settings")
      const data = await response.json()
      if (data.success) {
        setSections(data.data.sections || [])
        setSettings(data.data.settings || [])
        setSchoolInfo(data.data.school || [])
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const table = activeTab === "sections" ? "section" : activeTab === "settings" ? "setting" : "school"
      
      const method = editingItem?.id ? "PUT" : "POST"
      const body = editingItem?.id 
        ? { table, id: editingItem.id, ...formData }
        : { table, ...formData }

      const response = await fetch("/api/settings", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        fetchData()
        setShowModal(false)
        setEditingItem(null)
        setFormData({})
      } else {
        alert(data.error || "Failed to save")
      }
    } catch (error) {
      console.error("Failed to save:", error)
    }
  }

  const handleDelete = async (table: string, id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    try {
      await fetch(`/api/settings?table=${table}&id=${id}`, { method: "DELETE" })
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const openEdit = (item: any) => {
    setEditingItem(item)
    if (activeTab === "sections") {
      setFormData({ list_name: "sections", item_name: item.item_name, item_value: item.item_value, item_order: item.item_order || 0 })
    } else if (activeTab === "settings") {
      setFormData({ key_name: item.key_name, key_value: item.key_value, description: item.description || "" })
    } else {
      setFormData({ key_name: item.key_name, key_value: item.key_value })
    }
    setShowModal(true)
  }

  const openAdd = () => {
    setEditingItem(null)
    if (activeTab === "sections") {
      setFormData({ list_name: "sections", item_name: "", item_value: "", item_order: 0 })
    } else if (activeTab === "settings") {
      setFormData({ key_name: "", key_value: "", description: "" })
    } else {
      setFormData({ key_name: "", key_value: "" })
    }
    setShowModal(true)
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee]"></div>
      </div>
    )
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
              <i className="fas fa-cog text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("sections")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "sections" 
                ? "bg-[#4361ee] text-white" 
                : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300"
            }`}
          >
            <i className="fas fa-users mr-2"></i>
            Sections
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "settings" 
                ? "bg-[#4361ee] text-white" 
                : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300"
            }`}
          >
            <i className="fas fa-cog mr-2"></i>
            System Settings
          </button>
          <button
            onClick={() => setActiveTab("school")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "school" 
                ? "bg-[#4361ee] text-white" 
                : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300"
            }`}
          >
            <i className="fas fa-school mr-2"></i>
            School Info
          </button>
        </div>

        {/* Sections Tab */}
        {activeTab === "sections" && (
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Sections</h2>
              <button onClick={openAdd} className="bg-[#4361ee] text-white px-4 py-2 rounded-lg hover:opacity-90">
                <i className="fas fa-plus mr-2"></i>Add Section
              </button>
            </div>
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{section.item_name}</div>
                    <div className="text-sm text-gray-500">{section.item_value}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(section)} className="text-[#4361ee] hover:opacity-80">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleDelete("section", section.id)} className="text-red-500 hover:opacity-80">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              {sections.length === 0 && <p className="text-gray-500 text-center py-4">No sections found</p>}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Settings</h2>
              <button onClick={openAdd} className="bg-[#4361ee] text-white px-4 py-2 rounded-lg hover:opacity-90">
                <i className="fas fa-plus mr-2"></i>Add Setting
              </button>
            </div>
            <div className="space-y-3">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{setting.key_name}</div>
                    <div className="text-sm text-gray-500">{setting.key_value}</div>
                    {setting.description && <div className="text-xs text-gray-400">{setting.description}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(setting)} className="text-[#4361ee] hover:opacity-80">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleDelete("setting", setting.id)} className="text-red-500 hover:opacity-80">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              {settings.length === 0 && <p className="text-gray-500 text-center py-4">No settings found</p>}
            </div>
          </div>
        )}

        {/* School Info Tab */}
        {activeTab === "school" && (
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">School Information</h2>
              <button onClick={openAdd} className="bg-[#4361ee] text-white px-4 py-2 rounded-lg hover:opacity-90">
                <i className="fas fa-plus mr-2"></i>Add Info
              </button>
            </div>
            <div className="space-y-3">
              {schoolInfo.map((info) => (
                <div key={info.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{info.key_name.replace(/_/g, " ")}</div>
                    <div className="text-sm text-gray-500">{info.key_value}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(info)} className="text-[#4361ee] hover:opacity-80">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleDelete("school", info.id)} className="text-red-500 hover:opacity-80">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              {schoolInfo.length === 0 && <p className="text-gray-500 text-center py-4">No school info found</p>}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingItem ? "Edit" : "Add"} {activeTab === "sections" ? "Section" : activeTab === "settings" ? "Setting" : "Info"}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                {activeTab === "sections" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section Name</label>
                      <input
                        type="text"
                        value={formData.item_name || ""}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <input
                        type="text"
                        value={formData.item_value || ""}
                        onChange={(e) => setFormData({ ...formData, item_value: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order</label>
                      <input
                        type="number"
                        value={formData.item_order || 0}
                        onChange={(e) => setFormData({ ...formData, item_order: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
                {activeTab === "settings" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Name</label>
                      <input
                        type="text"
                        value={formData.key_name || ""}
                        onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value</label>
                      <input
                        type="text"
                        value={formData.key_value || ""}
                        onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <input
                        type="text"
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
                {activeTab === "school" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key</label>
                      <input
                        type="text"
                        value={formData.key_name || ""}
                        onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value</label>
                      <input
                        type="text"
                        value={formData.key_value || ""}
                        onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-[#4361ee] text-white py-2 rounded-lg hover:opacity-90">
                    Save
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
