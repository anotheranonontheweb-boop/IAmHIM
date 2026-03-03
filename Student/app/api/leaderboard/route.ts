import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category") || "streak"

    const db = await getDatabase()
    const users = await db.getAllUsers()
    const stats = await db.getAllStats()
    
    const statsMap = new Map(stats?.map(s => [s.user_id, s]) || [])
    
    const leaderboard = (users || [])
      .map((user) => {
        const userStats = statsMap.get(user.id)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          grade: user.grade,
          avatar: user.avatar,
          ...userStats,
        }
      })
      .sort((a, b) => {
        if (category === "streak") {
          return (b.streak || 0) - (a.streak || 0)
        } else if (category === "classPoints") {
          return (b.points || 0) - (a.points || 0)
        } else {
          return (b.total_points || 0) - (a.total_points || 0)
        }
      })

    return NextResponse.json({
      leaderboard,
      category,
    })
  } catch (error) {
    console.error("[v0] Leaderboard fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
