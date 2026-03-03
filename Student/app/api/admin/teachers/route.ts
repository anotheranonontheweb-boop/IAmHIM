import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDatabase()
    const teachers = await db.getAllTeachers()
    return NextResponse.json({ teachers: teachers || [] })
  } catch (error) {
    console.error("[v0] Admin teachers error:", error)
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, subject, employee_id, role } = await request.json()

    if (!name || !email || !password || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const teacher = await db.createTeacher({
      name,
      email,
      password,
      subject,
      employee_id: employee_id || `EMP-${Date.now()}`,
      role: role || "teacher",
      avatar: "👨‍🏫",
      is_active: true,
    })

    return NextResponse.json({ success: true, teacher })
  } catch (error) {
    console.error("[v0] Admin teachers POST error:", error)
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 })
  }
}
