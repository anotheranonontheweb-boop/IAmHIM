import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function PUT(request: NextRequest) {
  try {
    const { userId, name, avatar, currentPassword, newPassword } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.findUserById(parseInt(userId))

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Handle password change
    if (currentPassword && newPassword) {
      if (user.password !== currentPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }
      await db.updateUser(parseInt(userId), { password: newPassword })
      return NextResponse.json({ success: true })
    }

    // Handle name update
    if (name) {
      await db.updateUser(parseInt(userId), { name })
      return NextResponse.json({ success: true })
    }

    // Handle avatar update
    if (avatar) {
      await db.updateUser(parseInt(userId), { avatar })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "No valid update provided" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Student profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
