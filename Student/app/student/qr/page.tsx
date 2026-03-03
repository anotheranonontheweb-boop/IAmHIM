"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"

export default function StudentQRPage() {
  const router = useRouter()
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const userRole = localStorage.getItem("userRole")
        const userId = localStorage.getItem("userId")

        if (!userId || userRole !== "student") {
          router.push("/")
          return false
        }
        setUserId(userId)
        setUserName(localStorage.getItem("username") || "Student")
        return true
      }
      return false
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (userId && canvasRef.current) {
      const qrData = `STU:${userId}:SCHOOL2024`
      
      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: "#4361ee",
          light: "#ffffff"
        }
      }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    }
  }, [userId])

  const qrData = `STU:${userId}:SCHOOL2024`

  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement("a")
      link.download = `${userName.replace(/\s+/g, "_")}_QR.png`
      link.href = canvasRef.current.toDataURL("image/png")
      link.click()
    }
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
              <button onClick={() => router.push("/student")} className="text-[#4361ee] hover:opacity-80">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <i className="fas fa-qrcode text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My QR Code</h1>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{userName}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Scan this QR code for attendance</p>

          {/* QR Code Display */}
          <div className="bg-white p-4 rounded-xl inline-block mb-6 border-2 border-[#4361ee]">
            <canvas ref={canvasRef} className="w-48 h-48"></canvas>
          </div>

          {/* QR Data Text */}
          <div className="bg-gray-100 dark:bg-[#0f172a] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Student ID:</p>
            <p className="font-mono text-lg text-gray-900 dark:text-white">{userId}</p>
          </div>

          {/* Instructions */}
          <div className="text-left bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instructions:</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>1. Show this QR code to your teacher during attendance</li>
              <li>2. Make sure the QR code is clear and scannable</li>
              <li>3. Your attendance will be marked automatically</li>
            </ul>
          </div>

          <button
            onClick={downloadQR}
            className="bg-[#4361ee] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            <i className="fas fa-download mr-2"></i>
            Download QR Code
          </button>
        </div>
      </main>
    </div>
  )
}
