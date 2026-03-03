import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get("section")

    const db = await getDatabase()

    if (!section) {
      // Get all students
      const students = await db.getAllUsers()
      return NextResponse.json({ students: students?.filter(s => s.role === 'student') || [] })
    }

    // Get students by section
    const students = await db.getStudentsBySection(section)

    return NextResponse.json({ students: students || [] })
  } catch (error) {
    console.error("[v0] Teacher students error:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}
