import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDatabase()
    const sections = await db.getAllSections()
    return NextResponse.json({ sections: sections || [] })
  } catch (error) {
    console.error("[v0] Admin sections error:", error)
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { section_name, grade_level, adviser_id } = await request.json()

    if (!section_name || !grade_level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const section = await db.createSection({
      section_name,
      grade_level,
      adviser_id: adviser_id || null,
      is_active: true,
    })

    return NextResponse.json({ success: true, section })
  } catch (error) {
    console.error("[v0] Admin sections POST error:", error)
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, adviser_id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const section = await db.updateSection(id, { adviser_id })

    return NextResponse.json({ success: true, section })
  } catch (error) {
    console.error("[v0] Admin sections PUT error:", error)
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    await db.deleteSection(parseInt(id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Admin sections DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 })
  }
}
