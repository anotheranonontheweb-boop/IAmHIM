import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET - Fetch all settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key')
    
    if (error) {
      // If table doesn't exist, return defaults
      if (error.message.includes('does not exist')) {
        return NextResponse.json([
          { key: 'present_points', value: '10', description: 'Points for present' },
          { key: 'late_points', value: '5', description: 'Points for late' }
        ])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (err) {
    console.error("[v0] Settings error:", err)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// PUT - Update a setting
export async function PUT(request: NextRequest) {
  try {
    const { key, value } = await request.json()
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value required" }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('settings')
      .upsert({ 
        key, 
        value: String(value),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .select()
      .single()
    
    if (error) {
      // If table doesn't exist, return error
      if (error.message.includes('does not exist')) {
        return NextResponse.json({ error: "Settings table not configured. Run migration first." }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v0] Settings update error:", err)
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
}
