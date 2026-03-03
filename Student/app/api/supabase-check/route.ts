import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Test connection by checking if we can query the database
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .limit(5)

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: "Failed to connect to users table",
        details: usersError.message,
      }, { status: 500 })
    }

    const { data: teachers, error: teachersError } = await supabase
      .from("teachers")
      .select("*")
      .limit(5)

    if (teachersError) {
      return NextResponse.json({
        success: false,
        error: "Failed to connect to teachers table",
        details: teachersError.message,
      }, { status: 500 })
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from("attendance_sessions")
      .select("*")
      .limit(5)

    if (sessionsError) {
      return NextResponse.json({
        success: false,
        error: "Failed to connect to attendance_sessions table",
        details: sessionsError.message,
      }, { status: 500 })
    }

    // Get table counts
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    const { count: teacherCount } = await supabase
      .from("teachers")
      .select("*", { count: "exact", head: true })

    const { count: sessionCount } = await supabase
      .from("attendance_sessions")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase",
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        tables: {
          users: {
            count: userCount || 0,
            sample: users || []
          },
          teachers: {
            count: teacherCount || 0,
            sample: teachers || []
          },
          attendance_sessions: {
            count: sessionCount || 0,
            sample: sessions || []
          }
        }
      }
    })
  } catch (error) {
    console.error("Supabase check error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to connect to Supabase",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
