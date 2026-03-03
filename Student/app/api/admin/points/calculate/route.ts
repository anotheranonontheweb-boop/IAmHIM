import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Cron secret for Vercel Cron authentication
const CRON_SECRET = process.env.CRON_SECRET || "edutrack-cron-secret-2024"

// Default point values (fallback if settings table doesn't exist)
const DEFAULT_PRESENT_POINTS = 10
const DEFAULT_LATE_POINTS = 5

// Get point values from settings
async function getPointValues() {
  try {
    const { data } = await supabase.from('settings').select('key, value')
    
    if (!data || data.length === 0) {
      return { present: DEFAULT_PRESENT_POINTS, late: DEFAULT_LATE_POINTS }
    }
    
    const presentSetting = data.find(s => s.key === 'present_points')
    const lateSetting = data.find(s => s.key === 'late_points')
    
    return {
      present: presentSetting ? parseInt(presentSetting.value) : DEFAULT_PRESENT_POINTS,
      late: lateSetting ? parseInt(lateSetting.value) : DEFAULT_LATE_POINTS
    }
  } catch (err) {
    // If settings table doesn't exist, use defaults
    return { present: DEFAULT_PRESENT_POINTS, late: DEFAULT_LATE_POINTS }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for cron secret (for automated cron jobs)
    const authHeader = request.headers.get("authorization")
    const cronKey = request.nextUrl.searchParams.get("key")
    
    // Allow if cron key is valid OR if it's a regular authenticated request
    const isCronJob = cronKey === CRON_SECRET || authHeader?.includes(CRON_SECRET)
    
    // If neither, return unauthorized
    if (!isCronJob && !authHeader) {
      // For development/testing, we'll allow requests without auth
      // In production, uncomment the line below:
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json().catch(() => ({}))
    const targetDate = body.date // Optional: specific date in YYYY-MM-DD format
    
    // Use yesterday's date if not specified (since we're running at noon today)
    const date = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`
    
    // Get all attendance records for the day
    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("user_id, status, student_name")
      .gte("scanned_at", startOfDay)
      .lte("scanned_at", endOfDay)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get point values from settings (customizable by admin)
    const { present: PRESENT_POINTS, late: LATE_POINTS } = await getPointValues()
    
    // Group records by user_id (in case of multiple scans)
    const userRecords: Record<number, string> = {}
    for (const record of records || []) {
      // Keep the best status (present > late > absent)
      const currentStatus = userRecords[record.user_id]
      if (!currentStatus || 
          (record.status === "present") || 
          (record.status === "late" && currentStatus !== "present")) {
        userRecords[record.user_id] = record.status
      }
    }
    
    // Award points to each student
    const results = []
    for (const [userId, status] of Object.entries(userRecords)) {
      const numericUserId = parseInt(userId)
      let pointsToAdd = 0
      
      if (status === "present") {
        pointsToAdd = PRESENT_POINTS
      } else if (status === "late") {
        pointsToAdd = LATE_POINTS
      }
      
      if (pointsToAdd > 0) {
        // Get current stats
        const { data: currentStats } = await supabase
          .from("user_stats")
          .select("points, total_points")
          .eq("user_id", numericUserId)
          .single()
        
        const newPoints = (currentStats?.points || 0) + pointsToAdd
        const newTotalPoints = (currentStats?.total_points || 0) + pointsToAdd
        
        // Update stats
        const { error: updateError } = await supabase
          .from("user_stats")
          .update({ 
            points: newPoints,
            total_points: newTotalPoints
          })
          .eq("user_id", numericUserId)
        
        if (updateError) {
          console.error(`Error updating stats for user ${userId}:`, updateError)
        }
        
        results.push({
          user_id: numericUserId,
          status,
          points_added: pointsToAdd,
          new_total: newPoints
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      date,
      points_config: { present: PRESENT_POINTS, late: LATE_POINTS },
      students_processed: results.length,
      results
    })
    
  } catch (err) {
    console.error("[v0] Error calculating points:", err)
    return NextResponse.json({ error: "Failed to calculate points" }, { status: 500 })
  }
}
