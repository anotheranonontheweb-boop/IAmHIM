import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get pending reward redemptions
    const { data: redemptions, error } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("[v0] Fetch redemptions error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user details for each redemption
    const redemptionsWithUsers = await Promise.all(
      (redemptions || []).map(async (r) => {
        const { data: user } = await supabase
          .from('users')
          .select('name, email, grade, avatar')
          .eq('id', r.user_id)
          .single()
        const { data: stats } = await supabase
          .from('user_stats')
          .select('points')
          .eq('user_id', r.user_id)
          .single()
        return { ...r, user, stats }
      })
    )

    return NextResponse.json({ redemptions: redemptionsWithUsers })
  } catch (err) {
    console.error("[v0] Error fetching redemptions:", err)
    return NextResponse.json({ error: "Failed to fetch redemptions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, rewardId, rewardName, pointsCost } = body

    if (!userId || !rewardId || !rewardName || !pointsCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user has enough points
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('points')
      .eq('user_id', userId)
      .single()

    if (statsError || !userStats || userStats.points < pointsCost) {
      return NextResponse.json({ error: "Not enough points" }, { status: 400 })
    }

    // Create redemption request
    const { data: redemption, error } = await supabase
      .from('reward_redemptions')
      .insert({
        user_id: userId,
        reward_id: rewardId,
        reward_name: rewardName,
        points_cost: pointsCost,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Redemption error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, redemption })
  } catch (err) {
    console.error("[v0] Error creating redemption:", err)
    return NextResponse.json({ error: "Failed to create redemption" }, { status: 500 })
  }
}

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
      // Get current user points
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('points')
        .eq('user_id', redemption.user_id)
        .single()

      if (statsError || !userStats) {
        return NextResponse.json({ error: "User stats not found" }, { status: 500 })
      }

      // Check if user has enough points
      if (userStats.points < redemption.points_cost) {
        // Mark as rejected due to insufficient points
        await supabase
          .from('reward_redemptions')
          .update({ 
            status: 'rejected', 
            processed_at: new Date().toISOString()
          })
          .eq('id', parseInt(id))
        
        // Add activity for rejected redemption
        await supabase.from('activities').insert({
          user_id: redemption.user_id,
          type: 'reward_rejected',
          description: `Request rejected: ${redemption.reward_name} - Insufficient points`,
          points_earned: 0,
          created_at: new Date().toISOString()
        })
        
        return NextResponse.json({ 
          error: "Insufficient points - redemption automatically rejected" 
        }, { status: 400 })
      }

      // Deduct points from user (subtract instead of set)
      const newPoints = userStats.points - redemption.points_cost
      const { error: pointsError } = await supabase
        .from('user_stats')
        .update({ points: newPoints })
        .eq('user_id', redemption.user_id)

      if (pointsError) {
        console.error("[v0] Points deduction error:", pointsError)
        return NextResponse.json({ error: "Failed to deduct points" }, { status: 500 })
      }

      // Add to activities table for student dashboard
      const { error: activityError } = await supabase.from('activities').insert({
        user_id: redemption.user_id,
        type: 'reward_redeemed',
        description: `Redeemed: ${redemption.reward_name}`,
        points_earned: -redemption.points_cost,
        created_at: new Date().toISOString()
      })
      
      if (activityError) {
        console.error("[v0] Activity insert error:", activityError)
      }

      // Update redemption status to approved
      const { error: updateError } = await supabase
        .from('reward_redemptions')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('id', parseInt(id))

      if (updateError) {
        console.error("[v0] Update error:", updateError)
        return NextResponse.json({ error: "Failed to approve redemption" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Redemption approved" })
    } else if (action === "reject") {
      // Add to activities table for rejected redemption
      const { error: activityError } = await supabase.from('activities').insert({
        user_id: redemption.user_id,
        type: 'reward_rejected',
        description: `Request rejected: ${redemption.reward_name}`,
        points_earned: 0,
        created_at: new Date().toISOString()
      })
      
      if (activityError) {
        console.error("[v0] Activity insert error:", activityError)
      }

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
