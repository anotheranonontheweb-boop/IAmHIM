import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action") // "approve" or "reject"

    if (!id || !action) {
      return NextResponse.json({ error: "Missing id or action" }, { status: 400 })
    }

    // Get the redemption record
    const { data: redemption, error: fetchError } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('id', parseInt(id))
      .single()

    if (fetchError || !redemption) {
      return NextResponse.json({ error: "Redemption not found" }, { status: 404 })
    }

    if (action === "approve") {
      // Deduct points from user
      const { error: pointsError } = await supabase
        .from('user_stats')
        .update({ points: redemption.points_cost })
        .eq('user_id', redemption.user_id)

      if (pointsError) {
        return NextResponse.json({ error: "Failed to deduct points" }, { status: 500 })
      }

      // Update redemption status to approved
      const { error: updateError } = await supabase
        .from('reward_redemptions')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('id', parseInt(id))

      if (updateError) {
        return NextResponse.json({ error: "Failed to approve redemption" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Redemption approved" })
    } else if (action === "reject") {
      // Just update status to rejected
      const { error: updateError } = await supabase
        .from('reward_redemptions')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('id', parseInt(id))

      if (updateError) {
        return NextResponse.json({ error: "Failed to reject redemption" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Redemption rejected" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    console.error("[v0] Error processing redemption:", err)
    return NextResponse.json({ error: "Failed to process redemption" }, { status: 500 })
  }
}
