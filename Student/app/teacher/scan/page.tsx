"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"

interface ScannedStudent {
  id: number
  name: string
  grade: string
  time: string
  status: "present" | "late" | "absent"
  avatar?: string
}

interface Student {
  id: number
  name: string
  grade: string
  section_id: string
  avatar?: string
}

interface PendingStudent {
  id: number
  name: string
  grade: string
  section: string
  avatar?: string
  email?: string
}

export default function TeacherScanPage() {
  const router = useRouter()
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [showStudentList, setShowStudentList] = useState(false)
  const [lastScan, setLastScan] = useState<ScannedStudent | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Absent reason modal states
  const [showAbsentModal, setShowAbsentModal] = useState(false)
  const [absentStudent, setAbsentStudent] = useState<{id: number, name: string, grade: string} | null>(null)
  const [absentReason, setAbsentReason] = useState("")
  const [absenceType, setAbsenceType] = useState<"excused" | "unexcused">("unexcused")
  const [manualId, setManualId] = useState("")
  const [manualMode, setManualMode] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<{id: string, label: string}[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isScanning = useRef(false)

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingStudent, setPendingStudent] = useState<PendingStudent | null>(null)
  const [pendingQrData, setPendingQrData] = useState<string | null>(null)

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

  // Global error handler to prevent page refreshes on unhandled errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Handle unhandled promise rejections
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.error("Unhandled promise rejection:", event.reason)
        // Don't let it crash the app
        event.preventDefault()
      }

      // Handle uncaught errors
      const handleError = (event: ErrorEvent) => {
        console.error("Uncaught error:", event.error)
        // Don't let it crash the app
        event.preventDefault()
      }

      // Warn before leaving while session is active
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (sessionActive) {
          event.preventDefault()
          event.returnValue = "You have an active attendance session. Are you sure you want to leave?"
          return "You have an active attendance session. Are you sure you want to leave?"
        }
      }

      // Handle navigation attempts
      const handlePopState = (event: PopStateEvent) => {
        if (sessionActive) {
          // Prevent back button
          event.preventDefault()
          alert("Please end the attendance session before leaving this page.")
          // Push current state again to stay on page
          window.history.pushState(null, "", window.location.href)
        }
      }

      window.addEventListener("unhandledrejection", handleUnhandledRejection)
      window.addEventListener("error", handleError)
      window.addEventListener("beforeunload", handleBeforeUnload)
      window.addEventListener("popstate", handlePopState)

      return () => {
        window.removeEventListener("unhandledrejection", handleUnhandledRejection)
        window.removeEventListener("error", handleError)
        window.removeEventListener("beforeunload", handleBeforeUnload)
        window.removeEventListener("popstate", handlePopState)
      }
    }
  }, [sessionActive])

  // Use refs to track session state for periodic checks
  const sessionActiveRef = useRef(false)
  const sessionIdRef = useRef<number | null>(null)

  // Update refs when state changes
  useEffect(() => {
    sessionActiveRef.current = sessionActive
    sessionIdRef.current = sessionId
  }, [sessionActive, sessionId])

  // Check for existing active session on mount and restore if exists
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    
    const checkExistingSession = async () => {
      try {
        const section = localStorage.getItem("userSection") || "10-A"
        const response = await fetch(`/api/attendance/sessions?active=true&section=${section}`)
        const data = await response.json()
        
        if (data.sessions && data.sessions.length > 0) {
          // Found an active session - restore it
          const activeSession = data.sessions[0]
          setSessionId(activeSession.id)
          setSessionActive(true)
          // Save to localStorage for persistence
          localStorage.setItem("activeSessionId", activeSession.id.toString())
          await fetchStudents()
          // Start camera after restoring session
          setTimeout(() => startCamera(), 500)
        } else {
          // No active session - clear localStorage if exists
          // Note: We don't automatically clear - user should manually end sessions
          console.log("No active session found")
        }
      } catch (err) {
        console.error("Failed to check existing session:", err)
      }
    }
    
    checkExistingSession()
    
    // Note: We don't do periodic session checks anymore to avoid interference with scanning
    // The session will remain active until the teacher explicitly clicks "End Session"
    
    return () => {
      // Cleanup on unmount
    }
  }, [])

  const fetchStudents = async () => {
    try {
      const section = localStorage.getItem("userSection") || "10-A"
      const response = await fetch(`/api/teacher/students?section=${section}`)
      const data = await response.json()
      setStudents(data.students || [])
    } catch (err) {
      console.error("Failed to fetch students:", err)
    }
  }

  // Check if avatar is a base64 image
  const isAvatarImage = (avatar: string) => {
    return avatar && avatar.startsWith('data:image')
  }

  // Process scanned QR code - show confirmation modal first
  const processScanWithConfirmation = async (qrData: string) => {
    // Debug: log the scan
    console.log("[SCAN] Processing QR:", qrData)
    
    if (!sessionId) {
      console.log("[SCAN] No session ID")
      setError("No active session")
      return
    }

    // Prevent duplicate scans in quick succession
    const existingScan = scannedStudents.find(s => 
      qrData.includes(s.id.toString())
    )
    if (existingScan) {
      console.log("[SCAN] Already scanned:", existingScan)
      setError("Already scanned!")
      setTimeout(() => setError(""), 3000)
      return
    }

    // CRITICAL: Stop scanning while showing modal to prevent any double-processing
    console.log("[SCAN] Stopping camera temporarily")
    isScanning.current = false
    if (scannerRef.current) {
      scannerRef.current.pause()
    }

    // Parse QR code to get student ID
    const qrPattern = /^STU:(\d+):SCHOOL2024$/
    const match = qrData.match(qrPattern)
    
    if (!match) {
      console.log("[SCAN] Invalid QR format")
      setError("Invalid QR code format")
      // Resume scanning
      isScanning.current = true
      if (scannerRef.current) {
        scannerRef.current.resume()
      }
      return
    }

    const studentId = parseInt(match[1])
    console.log("[SCAN] Student ID:", studentId)

    try {
      // Fetch student details from database
      const response = await fetch(`/api/teacher/students?section=${localStorage.getItem("userSection") || "10-A"}`)
      const data = await response.json()
      const studentList = data.students || []
      
      const student = studentList.find((s: Student) => s.id === studentId)
      
      if (!student) {
        console.log("[SCAN] Student not found in section")
        setError("Student not found in your section")
        // Resume scanning
        isScanning.current = true
        if (scannerRef.current) {
          scannerRef.current.resume()
        }
        setTimeout(() => setError(""), 3000)
        return
      }

      // Check if already scanned (double check)
      const alreadyScanned = scannedStudents.find(s => s.id === studentId)
      if (alreadyScanned) {
        console.log("[SCAN] Already in scanned list:", alreadyScanned)
        setError(`${student.name} already marked as ${alreadyScanned.status}!`)
        // Resume scanning
        isScanning.current = true
        if (scannerRef.current) {
          scannerRef.current.resume()
        }
        setTimeout(() => setError(""), 3000)
        return
      }

      // Show confirmation modal - camera is now paused
      setPendingStudent({
        id: student.id,
        name: student.name,
        grade: student.grade,
        section: student.section_id,
        avatar: student.avatar
      })
      setPendingQrData(qrData)
      setShowConfirmModal(true)
    } catch (err) {
      console.error("[SCAN] Error fetching student:", err)
      setError("Failed to validate student")
      // Resume scanning on error
      isScanning.current = true
      if (scannerRef.current) {
        scannerRef.current.resume()
      }
    }
  }

  // Confirm attendance after modal - with status (present or late)
  const confirmAttendance = async (status: "present" | "late") => {
    if (!pendingStudent || !pendingQrData || !sessionId) return

    try {
      // Use the teacher attendance API to manually mark with specific status
      const response = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          userId: pendingStudent.id,
          studentName: pendingStudent.name,
          grade: pendingStudent.grade,
          status: status,
          scanMethod: "qr_code",
        }),
      })

      const data = await response.json()

      if (data.success || data.message?.includes("already")) {
        const student: ScannedStudent = {
          id: pendingStudent.id,
          name: pendingStudent.name,
          grade: pendingStudent.grade,
          time: new Date().toLocaleTimeString(),
          status: status,
          avatar: pendingStudent.avatar
        }

        setScannedStudents((prev) => [...prev, student])
        setLastScan(student)
        setSuccess(`${student.name} marked as ${student.status}!`)
        setError("")

        // Play sound
        try {
          const audio = new Audio("/beep.mp3")
          audio.play().catch(() => {})
        } catch {}

        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to mark attendance")
      }
    } catch (err) {
      console.error("Scan error:", err)
      setError("Failed to process scan")
    } finally {
      setShowConfirmModal(false)
      setPendingStudent(null)
      setPendingQrData(null)
      
      // Resume the scanner so teacher can scan next student
      console.log("[SCAN] Resuming scanner after confirmation")
      isScanning.current = true
      if (scannerRef.current) {
        try {
          scannerRef.current.resume()
        } catch (e) {
          console.log("[SCAN] Resume failed, restarting camera")
          startCamera()
        }
      }
    }
  }

  // Cancel attendance confirmation
  const cancelAttendance = () => {
    setShowConfirmModal(false)
    setPendingStudent(null)
    setPendingQrData(null)
    
    // Resume the scanner so teacher can scan next student
    console.log("[SCAN] Resuming scanner after cancel")
    isScanning.current = true
    if (scannerRef.current) {
      try {
        scannerRef.current.resume()
      } catch (e) {
        console.log("[SCAN] Resume failed, restarting camera")
        startCamera()
      }
    }
  }

  const markStudentAttendance = async (studentId: number, studentName: string, grade: string, status: "present" | "late" | "absent", absentReasonData?: string, absenceTypeData?: string) => {
    if (!sessionId) return

    // Check if already scanned
    const existingScan = scannedStudents.find(s => s.id === studentId)
    if (existingScan) {
      setError(`${studentName} already marked as ${existingScan.status}!`)
      setTimeout(() => setError(""), 3000)
      return
    }

    try {
      const response = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
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

      if (data.success || data.message?.includes("already")) {
        const newStudent: ScannedStudent = {
          id: studentId,
          name: studentName,
          grade: grade,
          time: new Date().toLocaleTimeString(),
          status: status,
        }
        setScannedStudents((prev) => [...prev, newStudent])
        setLastScan(newStudent)
        setSuccess(`${studentName} marked as ${status}!`)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to mark attendance")
        setTimeout(() => setError(""), 3000)
      }
    } catch (err) {
      console.error("Attendance error:", err)
      setError("Failed to mark attendance")
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
    if (!absentStudent || !sessionId) return
    
    setShowAbsentModal(false)
    await markStudentAttendance(absentStudent.id, absentStudent.name, absentStudent.grade, "absent", absentReason, absenceType)
    setAbsentStudent(null)
  }

  const startCamera = async (preferEnvironment: boolean = true) => {
    try {
      isScanning.current = true
      
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      // Get available cameras to check what's available
      const cameras = await Html5Qrcode.getCameras()
      setAvailableCameras(cameras || [])
      
      // If no cameras available
      if (cameras && cameras.length === 0) {
        throw new Error("No cameras found on this device")
      }

      // Find the best camera - prefer environment (back) camera on mobile,
      // but fall back to any available camera on desktop
      let cameraId: string | undefined
      let cameraIndex = 0
      
      if (preferEnvironment) {
        // Try to find back camera first
        const backCamera = cameras?.find((cam, index) => {
          const label = cam.label.toLowerCase()
          if (label.includes('back') || label.includes('environment') || label.includes('rear')) {
            cameraIndex = index
            return true
          }
          return false
        })
        cameraId = backCamera?.id
        
        // If no back camera found, use first camera
        if (!cameraId && cameras && cameras.length > 0) {
          cameraId = cameras[0].id
        }
      } else {
        // Use the next camera in the list (for switching)
        if (cameras && cameras.length > 0) {
          cameraIndex = currentCameraIndex % cameras.length
          cameraId = cameras[cameraIndex].id
        }
      }

      setCurrentCameraIndex(cameraIndex)

      // Start scanning with selected camera
      await scanner.start(
        cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          // QR code detected!
          if (decodedText && isScanning.current) {
            processScanWithConfirmation(decodedText)
          }
        },
        (error: any) => {
          // Ignore scan errors
        }
      )
    } catch (err: any) {
      console.error("Camera error:", err)
      // More specific error messages
      if (err.message?.includes("Permission") || err.message?.includes("NotAllowed")) {
        setError("Camera permission denied. Please allow camera access or use manual entry.")
      } else if (err.message?.includes("No cameras")) {
        setError("No camera found on this device. Please use manual entry.")
      } else {
        setError("Unable to access camera. Please use manual entry.")
      }
      setManualMode(true)
    }
  }

  // Switch to next available camera
  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      setError("Only one camera available")
      setTimeout(() => setError(""), 2000)
      return
    }
    
    stopCamera()
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length
    setCurrentCameraIndex(nextIndex)
    await startCameraWithCameraIndex(nextIndex)
  }

  // Start camera with specific camera index
  const startCameraWithCameraIndex = async (cameraIndex: number) => {
    try {
      isScanning.current = true
      
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      const cameras = await Html5Qrcode.getCameras()
      
      if (!cameras || cameras.length === 0) {
        throw new Error("No cameras found on this device")
      }

      const cameraId = cameras[cameraIndex % cameras.length].id

      // Start scanning with selected camera
      await scanner.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          if (decodedText && isScanning.current) {
            processScanWithConfirmation(decodedText)
          }
        },
        (error: any) => {
          // Ignore scan errors
        }
      )
    } catch (err: any) {
      console.error("Camera switch error:", err)
      setError("Failed to switch camera")
    }
  }

  const stopCamera = () => {
    isScanning.current = false
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
  }

  const startSession = async () => {
    try {
      const section = localStorage.getItem("userSection") || "10-A"
      const teacherId = localStorage.getItem("userId")

      // Create new attendance session
      const response = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: `Attendance - ${new Date().toLocaleDateString()}`,
          sectionId: section,
          createdBy: teacherId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError("Failed to start session")
        return
      }

      const newSessionId = data.session?.id || 1
      setSessionId(newSessionId)
      setSessionActive(true)
      setScannedStudents([])
      // Save session ID to localStorage for persistence across refreshes
      localStorage.setItem("activeSessionId", newSessionId.toString())
      await fetchStudents()
      startCamera()
    } catch (err) {
      console.error("Session start error:", err)
      setError("Failed to start attendance session")
    }
  }

  const endSession = async () => {
    stopCamera()
    setSessionActive(false)

    if (sessionId) {
      // Mark unscanned students as absent
      try {
        const section = localStorage.getItem("userSection") || "10-A"
        const studentsRes = await fetch(`/api/teacher/students?section=${section}`)
        const studentsData = await studentsRes.json()
        const students = studentsData.students || []

        // Get already scanned user IDs
        const scannedIds = scannedStudents.map((s) => s.id)

        // Mark absent students
        for (const student of students) {
          if (!scannedIds.includes(student.id)) {
            await fetch("/api/teacher/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: sessionId,
                userId: student.id,
                studentName: student.name,
                grade: student.grade,
                status: "absent",
                scanMethod: "auto",
              }),
            })
          }
        }

        // Deactivate session
        await fetch(`/api/attendance/sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        })
      } catch (err) {
        console.error("End session error:", err)
      }
    }

    setSessionId(null)
    setSessionActive(false)
    // Clear session from localStorage
    localStorage.removeItem("activeSessionId")
    router.push("/teacher")
  }

  const processScan = async (qrData: string) => {
    if (!sessionId) {
      setError("No active session")
      return
    }

    // Prevent duplicate scans in quick succession
    const existingScan = scannedStudents.find(s => 
      qrData.includes(s.id.toString())
    )
    if (existingScan) {
      setError("Already scanned!")
      setTimeout(() => setError(""), 3000)
      return
    }

    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: qrData,
          sessionId: sessionId,
        }),
      })

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        setError(`Scan failed: ${errorText}`)
        setTimeout(() => setError(""), 3000)
        return
      }

      const data = await response.json()

      if (data.success) {
        const student: ScannedStudent = {
          id: data.student.id,
          name: data.student.name,
          grade: data.student.grade,
          time: new Date(data.scannedAt).toLocaleTimeString(),
          status: data.status === "late" ? "late" : "present",
        }

        // Add to scanned students list (using functional update to ensure we have latest state)
        setScannedStudents(prev => {
          // Check again to prevent duplicates
          if (prev.some(s => s.id === student.id)) {
            return prev
          }
          return [...prev, student]
        })
        setLastScan(student)
        setSuccess(`${student.name} marked as ${student.status}!`)
        setError("")

        // Play sound
        try {
          const audio = new Audio("/beep.mp3")
          audio.play().catch(() => {})
        } catch {}

        // Keep success message longer and don't auto-clear
        setTimeout(() => setSuccess(""), 5000)
      } else if (data.duplicate) {
        setError(`${data.student?.name || "Student"} already checked in`)
        setTimeout(() => setError(""), 3000)
      } else {
        setError(data.error || "Invalid QR code")
        setTimeout(() => setError(""), 3000)
      }
    } catch (err) {
      console.error("Scan error:", err)
      setError("Failed to process scan")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualId.trim()) return

    const qrData = `STU:${manualId}:SCHOOL2024`
    await processScan(qrData)
    setManualId("")
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

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
              <i className="fas fa-qrcode text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">QR Scanner</h1>
            </div>
            {sessionActive && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-green-600 font-medium">Session Active</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Session Controls */}
        {!sessionActive ? (
          <div className="text-center">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 shadow-lg mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-qrcode text-white text-4xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Start Attendance Session
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click the button below to start scanning student QR codes
              </p>
              <button
                onClick={startSession}
                className="bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2 mx-auto"
              >
                <i className="fas fa-play"></i>
                Start Attendance
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Scanner Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Camera View */}
              <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Camera Scanner</h3>
                  {availableCameras.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Camera {currentCameraIndex + 1}/{availableCameras.length}
                    </span>
                  )}
                </div>
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <div id="qr-reader" className="w-full h-full"></div>
                </div>
                <div className="mt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setManualMode(!manualMode)}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:opacity-90 transition"
                    >
                      {manualMode ? "Use Camera" : "Manual Entry"}
                    </button>
                    {!manualMode && (
                      <button
                        onClick={switchCamera}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:opacity-90 transition"
                        title={availableCameras.length > 0 ? `Switch Camera (${currentCameraIndex + 1}/${availableCameras.length})` : "Switch Camera"}
                      >
                        <i className="fas fa-camera-rotate"></i>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowStudentList(!showStudentList)
                        if (!showStudentList) {
                          fetchStudents()
                        }
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition ${showStudentList ? "bg-[#4361ee] text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                    >
                      <i className="fas fa-users mr-2"></i>
                      Student List
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Entry */}
              {manualMode && (
                <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Manual Entry</h3>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4361ee] focus:border-transparent outline-none"
                        placeholder="Enter student ID"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#4361ee] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      Mark Attendance
                    </button>
                  </form>
                </div>
              )}

              {/* Student List */}
              {showStudentList && (
                <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      <i className="fas fa-users mr-2"></i>
                      Student List ({students.length})
                    </h3>
                    <button
                      onClick={fetchStudents}
                      className="text-[#4361ee] hover:text-[#3651e0] text-sm"
                    >
                      <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {students.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Loading students...</p>
                    ) : (
                      students.map((student) => {
                        const isMarked = scannedStudents.find(s => s.id === student.id)
                        return (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${isMarked ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.grade}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {isMarked ? (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isMarked.status === "present" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                  {isMarked.status.toUpperCase()}
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => markStudentAttendance(student.id, student.name, student.grade, "present")}
                                    className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition"
                                  >
                                    Present
                                  </button>
                                  <button
                                    onClick={() => markStudentAttendance(student.id, student.name, student.grade, "late")}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded text-xs font-medium hover:bg-yellow-600 transition"
                                  >
                                    Late
                                  </button>
                                  <button
                                    onClick={() => handleAbsentClick(student.id, student.name, student.grade)}
                                    className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition"
                                  >
                                    Absent
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Last Scan Result */}
              <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Last Scanned</h3>
                {lastScan ? (
                  <div className="text-center">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        lastScan.status === "present" ? "bg-green-100" : "bg-yellow-100"
                      }`}
                    >
                      <i
                        className={`fas ${lastScan.status === "present" ? "fa-check" : "fa-clock"} text-3xl ${
                          lastScan.status === "present" ? "text-green-600" : "text-yellow-600"
                        }`}
                      ></i>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{lastScan.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{lastScan.grade}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {lastScan.time} - {lastScan.status.toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No scans yet</p>
                )}
              </div>

              {/* Messages */}
              <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Status</h3>
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                  </div>
                )}
                {!error && !success && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Ready to scan</p>
                )}
              </div>
            </div>

            {/* Scanned Students List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 shadow-md">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Scanned Students ({scannedStudents.length})
              </h3>
              <div className="max-h-64 overflow-y-auto">
                {scannedStudents.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Grade</th>
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scannedStudents.map((student, i) => (
                        <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="py-2 font-medium text-gray-900 dark:text-white">{student.name}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">{student.grade}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">{student.time}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === "present"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No students scanned yet</p>
                )}
              </div>
            </div>

            {/* End Session Button */}
            <div className="mt-6 text-center">
              <button
                onClick={endSession}
                className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-600 transition flex items-center gap-2 mx-auto"
              >
                <i className="fas fa-stop"></i>
                End Session
              </button>
            </div>
          </>
        )}
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

      {/* Student Confirmation Modal */}
      {showConfirmModal && pendingStudent && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={cancelAttendance}
        >
          <div 
            className="bg-white dark:bg-[#1e293b] rounded-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Confirm Attendance
              </h2>
              
              {/* Student Profile */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] flex items-center justify-center">
                  {pendingStudent.avatar && isAvatarImage(pendingStudent.avatar) ? (
                    <img 
                      src={pendingStudent.avatar} 
                      alt={pendingStudent.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-white font-bold">
                      {pendingStudent.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {pendingStudent.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Grade {pendingStudent.grade} - Section {pendingStudent.section}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => confirmAttendance("present")}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-medium"
              >
                <i className="fas fa-check mr-2"></i>
                Present
              </button>
              <button
                onClick={() => confirmAttendance("late")}
                className="flex-1 bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition font-medium"
              >
                <i className="fas fa-clock mr-2"></i>
                Late
              </button>
              <button
                onClick={cancelAttendance}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:opacity-90 transition font-medium"
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
