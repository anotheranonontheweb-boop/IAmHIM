import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const activities = await db.findActivitiesByUserId(Number.parseInt(userId))

    return NextResponse.json({
      activities: activities || [],
    })
  } catch (error) {
    console.error("[v0] Activities fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, type, description, points_earned } = body

    if (!user_id || !type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase.from('activities').insert({
      user_id,
      type,
      description,
      points_earned: points_earned || 0,
      created_at: new Date().toISOString()
    }).select()

    if (error) {
      console.error("[v0] Activity insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, activity: data?.[0] })
  } catch (error) {
    console.error("[v0] Activity creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
