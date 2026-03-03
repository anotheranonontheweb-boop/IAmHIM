import { type NextRequest, NextResponse } from "next/server"
import { getAttendanceDB } from "@/lib/attendance-db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = parseInt(id)
    
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }
    
    const attendanceDb = await getAttendanceDB()
    const session = await attendanceDb.getSessionById(sessionId)
    
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    
    const records = await attendanceDb.getSessionRecords(sessionId)
    
    return NextResponse.json({
      session,
      records: records || [],
    })
  } catch (error) {
    console.error("[v0] Get session records error:", error)
    return NextResponse.json({ error: "Failed to fetch session records" }, { status: 500 })
  }
}

// DELETE - Deactivate a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = parseInt(id)
    
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }
    
    const attendanceDb = await getAttendanceDB()
    await attendanceDb.deactivateSession(sessionId)
    
    return NextResponse.json({ success: true, message: "Session deactivated" })
  } catch (error) {
    console.error("[v0] Deactivate session error:", error)
    return NextResponse.json({ error: "Failed to deactivate session" }, { status: 500 })
  }
}
