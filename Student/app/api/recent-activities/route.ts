import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Fetch recent activities for the user, ordered by most recent
    const { data: activities, error } = await supabase
      .from('recent_activities')
      .select('*')
      .eq('user_id', parseInt(userId))
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error("[v0] Recent activities fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    return NextResponse.json({
      activities: activities || [],
    })
  } catch (error) {
    console.error("[v0] Recent activities error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, activity_type, title, description, icon, icon_color, points } = body

    if (!user_id || !title || !description) {
      return NextResponse.json(
        { error: "user_id, title, and description are required" },
        { status: 400 }
      )
    }

    // If points are specified, add them to user_stats
    if (points && points > 0) {
      // Get current user stats
      const { data: currentStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('points, total_points')
        .eq('user_id', parseInt(user_id))
        .single()

      if (!fetchError && currentStats) {
        // Update points
        const newPoints = (currentStats.points || 0) + points
        const newTotalPoints = (currentStats.total_points || 0) + points
        
        await supabase
          .from('user_stats')
          .update({ 
            points: newPoints,
            total_points: newTotalPoints
          })
          .eq('user_id', parseInt(user_id))
      }
    }

    const { error } = await supabase
      .from('recent_activities')
      .insert({
        user_id: parseInt(user_id),
        activity_type,
        title,
        description,
        icon: icon || 'fa-clock',
        icon_color: icon_color || '#4361ee',
        points: points || 0,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error("[v0] Recent activity insert error:", error)
      return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Recent activity POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
