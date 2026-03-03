import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function PUT(request: NextRequest) {
  try {
    const { userId, userRole, name, avatar, currentPassword, newPassword } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Handle teacher/admin password change
    if (userRole === 'teacher' || userRole === 'admin') {
      const teacher = await db.findTeacherById(parseInt(userId))
      
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
      }

      // Handle password change
      if (currentPassword && newPassword) {
        if (teacher.password !== currentPassword) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
        }
        await db.updateTeacher(parseInt(userId), { password: newPassword })
        return NextResponse.json({ success: true })
      }

      // Handle name update
      if (name) {
        await db.updateTeacher(parseInt(userId), { name })
        return NextResponse.json({ success: true })
      }

      // Handle avatar update
      if (avatar) {
        await db.updateTeacher(parseInt(userId), { avatar })
        return NextResponse.json({ success: true })
      }
    }

    return NextResponse.json({ error: "No valid update provided" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Teacher profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
