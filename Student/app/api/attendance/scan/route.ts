import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { getAttendanceDB } from "@/lib/attendance-db"

export async function POST(request: NextRequest) {
  try {
    const { token, sessionId, deviceInfo } = await request.json()
    
    if (!token || !sessionId) {
      return NextResponse.json(
        { error: "QR code and session ID are required" },
        { status: 400 }
      )
    }
    
    // Parse the permanent QR code format: STU:{id}:SCHOOL2024
    const qrPattern = /^STU:(\d+):SCHOOL2024$/
    const match = token.match(qrPattern)
    
    if (!match) {
      return NextResponse.json(
        { error: "Invalid QR code format" },
        { status: 400 }
      )
    }
    
    const userId = parseInt(match[1])
    
    // Get user info from database
    const db = await getDatabase()
    const user = await db.findUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 400 }
      )
    }
    
    // Get attendance database
    const attendanceDb = await getAttendanceDB()
    
    // Get session details
    const session = await attendanceDb.getSessionById(parseInt(sessionId))
    
    if (!session) {
      return NextResponse.json(
        { error: "Invalid attendance session" },
        { status: 400 }
      )
    }
    
    if (!session.is_active) {
      return NextResponse.json(
        { error: "This attendance session is no longer active" },
        { status: 400 }
      )
    }
    
    if (new Date(session.expires_at!) < new Date()) {
      return NextResponse.json(
        { error: "This attendance session has expired" },
        { status: 400 }
      )
    }
    
    // Record the attendance
    const result = await attendanceDb.recordAttendance(
      parseInt(sessionId),
      user.id,
      user.name,
      user.grade,
      'qr_code'
    )
    
    if (result.duplicate) {
      return NextResponse.json({
        success: false,
        message: result.message,
        student: {
          name: user.name,
          grade: user.grade,
          avatar: user.avatar,
        },
        scannedAt: result.record.scanned_at,
        status: result.record.status,
        duplicate: true,
      }, { status: 200 })
    }

    // Add activity for attendance
    const statusText = result.record.status === 'present' ? 'attended class' : `arrived ${result.record.status}`
    
    // Try to add to recent_activities (may fail due to broken table)
    fetch('/api/recent-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        activity_type: result.record.status === 'present' ? 'attendance_present' : 'attendance_late',
        title: result.record.status === 'present' ? 'Attended Class' : 'Arrived Late',
        description: `You ${statusText} today!`,
        icon: 'fa-calendar-check',
        icon_color: result.record.status === 'present' ? '#22c55e' : '#f97316',
        points: result.record.status === 'present' ? 10 : 5
      })
    }).catch(err => console.log('Recent activity error (ignored):', err))

    // Also add to activities table for student dashboard
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        type: result.record.status === 'present' ? 'attendance_present' : 'attendance_late',
        description: `Attended: ${statusText}`,
        points_earned: result.record.status === 'present' ? 10 : 5
      })
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      student: {
        id: user.id,
        name: user.name,
        grade: user.grade,
        email: user.email,
        avatar: user.avatar,
      },
      scannedAt: result.record.scanned_at,
      status: result.record.status,
      duplicate: false,
    })
  } catch (error) {
    console.error("[v0] QR Scan error:", error)
    return NextResponse.json(
      { error: "Failed to process attendance" },
      { status: 500 }
    )
  }
}
