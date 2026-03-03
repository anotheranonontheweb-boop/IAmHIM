import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("user_id", parseInt(userId))

    if (error) {
      console.error("[v0] Attendance stats error:", error)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    const total = records?.length || 0
    const present = records?.filter((r) => r.status === "present").length || 0
    const late = records?.filter((r) => r.status === "late").length || 0
    const absent = records?.filter((r) => r.status === "absent").length || 0

    return NextResponse.json({
      stats: {
        total,
        present,
        late,
        absent,
        attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 100,
      },
    })
  } catch (error) {
    console.error("[v0] Attendance stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
