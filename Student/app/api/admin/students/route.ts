import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDatabase()
    const students = await db.getAllUsers()
    return NextResponse.json({ students: students?.filter(s => s.role === 'student') || [] })
  } catch (error) {
    console.error("[v0] Admin students error:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, grade, section_id } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const student = await db.createUser({
      name,
      email,
      password,
      grade: grade || section_id || "10-A",
      avatar: "👨‍🎓",
      enrolled_date: new Date().toISOString(),
      role: "student",
      section_id: section_id || grade || "10-A",
    })

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error("[v0] Admin students POST error:", error)
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, email, password, grade, section_id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const updates: any = { name, grade: grade || section_id, section_id: section_id || grade }
    if (password) updates.password = password

    const student = await db.updateUser(id, updates)

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error("[v0] Admin students PUT error:", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    await db.deleteUser(parseInt(id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Admin students DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}
