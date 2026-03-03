import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDatabase()
    const totalStudents = await db.getTotalStudents()
    const totalTeachers = await db.getTotalTeachers()
    const sections = await db.getAllSections()

    return NextResponse.json({
      total: totalStudents,
      teachers: totalTeachers,
      sections: sections?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Admin stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
