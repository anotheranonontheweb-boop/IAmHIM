"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { useTheme } from "@/lib/theme-context"
import { formatOrdinal } from "@/lib/utils"
import QRCode from "qrcode.react"
import { QrCode, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface User {
  id: number
  name: string
  email: string
  grade: string
  avatar: string
}

interface UserStats {
  streak: number
  points: number
  total_points: number
  class_rank: number
}

interface AttendanceStats {
  total: number
  present: number
  late: number
  early: number
  attendanceRate: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { isDarkMode, toggleTheme, isInitialized } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(true)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (typeof window !== "undefined") {
        const userId = localStorage.getItem("userId")

        if (!userId) {
          router.push("/")
          return
        }

        try {
          const response = await fetch(`/api/user/stats?userId=${userId}`)
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            setStats(data.stats)
          }
          
          // Fetch attendance stats
          try {
            const attResponse = await fetch(`/api/attendance/history?userId=${userId}`)
            if (attResponse.ok) {
              const attData = await attResponse.json()
              setAttendanceStats(attData.stats)
            }
          } catch (error) {
            console.error("Failed to fetch attendance stats:", error)
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [router])

  // Check if avatar is a base64 image
  const isAvatarImage = (avatar: string) => {
    return avatar && avatar.startsWith('data:image')
  }

  // Handle avatar click to trigger file input
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // Handle file selection and upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    setUploadingAvatar(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        
        // Update user avatar in database
        const userId = localStorage.getItem('userId')
        const userRole = localStorage.getItem('userRole')
        
        let response
        if (userRole === 'student') {
          response = await fetch('/api/student/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, avatar: base64 })
          })
        } else {
          response = await fetch('/api/teacher/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userRole, avatar: base64 })
          })
        }

        if (response.ok) {
          // Update local state
          setUser({ ...user, avatar: base64 })
        } else {
          alert('Failed to update avatar')
        }
        setUploadingAvatar(false)
      }
      reader.onerror = () => {
        alert('Failed to read file')
        setUploadingAvatar(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar')
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
        <Header activePage="profile" />
        <main className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee] mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading profile...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
        <Header activePage="profile" />
        <main className="flex items-center justify-center min-h-[80vh]">
          <p className="text-gray-600 dark:text-gray-400">Failed to load profile</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      <Header activePage="profile" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl p-8 shadow-md mb-6">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden cursor-pointer hover:opacity-90 transition"
                  onClick={handleAvatarClick}
                  title="Click to change profile picture"
                >
                  {user.avatar && isAvatarImage(user.avatar) ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] flex items-center justify-center">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-[#1e293b] flex items-center justify-center">
                  <CheckCircle size={16} className="text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Grade {user.grade} - Student</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    <i className="fas fa-envelope mr-1"></i> {user.email}
                  </span>
                  <span>
                    <i className="fas fa-calendar mr-1"></i> Member since: Sep 2023
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Statistics */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <i className="fas fa-chart-bar text-[#4361ee]"></i>
                Statistics
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Points</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.points || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-[#4361ee] h-2 rounded-full"
                      style={{ width: `${Math.min((stats?.points || 0) / 5, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Day Streak 🔥</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.streak || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min((stats?.streak || 0) / 2, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-2">Class Rank</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.class_rank ? formatOrdinal(stats.class_rank) : "-"}</span>
                </div>

                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-2">Total Points</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_points || 0}</span>
                </div>
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="text-[#4361ee]" size={20} />
                Attendance
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Attendance Rate</span>
                  <span className="text-xl font-bold text-green-500">{attendanceStats?.attendanceRate || 100}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{attendanceStats?.present || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Present</div>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3">
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{attendanceStats?.late || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Late</div>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{attendanceStats?.early || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Early</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - User Information & Account Center */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <i className="fas fa-user text-[#4361ee]"></i>
                User Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                  <div className="text-gray-900 dark:text-white font-medium">{user.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                  <div className="text-gray-900 dark:text-white font-medium">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Grade</label>
                  <div className="text-gray-900 dark:text-white font-medium">{user.grade}</div>
                </div>
              </div>
            </div>

            {/* Account Center */}
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <i className="fas fa-cog text-[#4361ee]"></i>
                Account Center
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f172a] transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-full flex items-center justify-center">
                      <i className="fas fa-palette text-white"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Theme</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {isDarkMode ? "Dark mode" : "Light mode"} - Click to switch
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    disabled={!isInitialized}
                    className={`relative w-14 h-7 rounded-full transition ${isDarkMode ? "bg-[#4361ee]" : "bg-gray-300"} ${!isInitialized ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? "translate-x-7" : ""}`}
                    ></span>
                  </button>
                </div>

                <button
                  onClick={() => setShowQR(true)}
                  className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f172a] transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-full flex items-center justify-center">
                      <QrCode className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Student QR Code</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Show for attendance check-in
                      </div>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white dark:bg-[#1e293b] rounded-xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Student QR Code</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Scan this code for attendance check-in</p>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center mb-4">
              <div className="mb-4 flex justify-center">
                {user ? (
                  <QRCode
                    value={`STU:${user.id}:SCHOOL2024`}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Loading...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <QrCode size={16} />
                <span>Permanent QR Code</span>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Student ID: STU-{user?.id}
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <div className="text-sm text-green-700 dark:text-green-300">
                  <div className="font-medium">Permanent Code</div>
                  <div className="text-green-600 dark:text-green-400 mt-1">
                    This QR code is permanent and will not change. Show it to your teacher during attendance.
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowQR(false)}
              className="w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
