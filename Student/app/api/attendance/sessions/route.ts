import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { sessionName, sectionId, createdBy } = await request.json()

    if (!sessionName || !createdBy) {
      return NextResponse.json({ error: "Session name and creator are required" }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours

    const { data: session, error } = await supabase
      .from("attendance_sessions")
      .insert({
        session_name: sessionName,
        section_id: sectionId || null,
        created_by: parseInt(createdBy),
        is_active: true,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Session create error:", error)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error("[v0] Session create error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get("active")
    const section = searchParams.get("section")

    let query = supabase
      .from("attendance_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (active === "true") {
      query = query.eq("is_active", true)
    }

    // Filter by section if provided
    if (section) {
      query = query.eq("section_id", section)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error("[v0] Sessions fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("[v0] Sessions fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}
