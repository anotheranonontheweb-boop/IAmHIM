import { type NextRequest, NextResponse } from "next/server"
import { getAttendanceDB } from "@/lib/attendance-db"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    const date = request.nextUrl.searchParams.get("date")
    const section = request.nextUrl.searchParams.get("section")
    
    // If userId is provided, get user's personal attendance history
    if (userId) {
      const attendanceDb = await getAttendanceDB()
      const records = await attendanceDb.getUserAttendance(parseInt(userId))
      const stats = await attendanceDb.getUserAttendanceStats(parseInt(userId))
      
      return NextResponse.json({
        records: records || [],
        stats,
      })
    }
    
    // If date is provided, get all attendance records for that date
    if (date) {
      const startOfDay = `${date}T00:00:00`
      const endOfDay = `${date}T23:59:59`
      
      const { data: records, error } = await supabase
        .from("attendance_records")
        .select("*")
        .gte("scanned_at", startOfDay)
        .lte("scanned_at", endOfDay)
        .order("scanned_at", { ascending: true })
      
      if (error) {
        console.error("Error fetching attendance records:", error)
        return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
      }
      
      return NextResponse.json({
        records: records || [],
      })
    }
    
    return NextResponse.json({ error: "User ID or date is required" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Get attendance history error:", error)
    return NextResponse.json({ error: "Failed to fetch attendance history" }, { status: 500 })
  }
}
