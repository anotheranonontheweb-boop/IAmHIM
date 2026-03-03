import { type NextRequest, NextResponse } from "next/server"
import { getAttendanceDB } from "@/lib/attendance-db"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    const attendanceDb = await getAttendanceDB()
    const tokenData = await attendanceDb.getOrCreateQRToken(parseInt(userId))
    
    return NextResponse.json({
      token: tokenData.token,
      expiresAt: tokenData.expires_at,
      isActive: tokenData.is_active,
    })
  } catch (error) {
    console.error("[v0] QR Token error:", error)
    return NextResponse.json({ error: "Failed to generate QR token" }, { status: 500 })
  }
}
