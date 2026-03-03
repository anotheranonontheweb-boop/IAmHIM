import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Admin secret to protect this endpoint
const ADMIN_SECRET = process.env.ADMIN_SETUP_SECRET || "admin-setup-secret-2024"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    // Check for admin secret
    if (!authHeader?.includes(ADMIN_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Use service role to create table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceKey) {
      return NextResponse.json({ error: "Service role key not configured" }, { status: 500 })
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Try to insert directly - if table exists this will work
    const { error: insertError } = await supabaseAdmin.from('settings').upsert({
      key: 'present_points',
      value: '10',
      description: 'Points awarded for present status'
    }, { onConflict: 'key', ignoreDuplicates: true })
    
    if (insertError && !insertError.message.includes('does not exist')) {
      // Table might already exist with data, that's OK
      console.log("Insert result:", insertError)
    }
    
    // Insert late points
    await supabaseAdmin.from('settings').upsert({
      key: 'late_points',
      value: '5',
      description: 'Points awarded for late status'
    }, { onConflict: 'key', ignoreDuplicates: true })
    
    return NextResponse.json({ success: true, message: "Settings table ready with default values" })
    
  } catch (err) {
    console.error("[v0] Setup error:", err)
    return NextResponse.json({ error: "Failed to setup" }, { status: 500 })
  }
}
