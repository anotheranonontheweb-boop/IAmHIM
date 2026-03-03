import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "sections", "settings", "school"
    
    let data = {}
    
    // Get sections from custom_lists
    if (!type || type === "sections") {
      const { data: sections } = await supabase
        .from("custom_lists")
        .select("*")
        .eq("list_name", "sections")
        .eq("is_active", true)
        .order("item_order")
      
      data = { ...data, sections: sections || [] }
    }
    
    // Get system settings
    if (!type || type === "settings") {
      const { data: settings } = await supabase
        .from("system_settings")
        .select("*")
      
      data = { ...data, settings: settings || [] }
    }
    
    // Get school info
    if (!type || type === "school") {
      const { data: school } = await supabase
        .from("school_info")
        .select("*")
      
      data = { ...data, school: school || [] }
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Settings error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { table, id, ...updates } = await request.json()
    
    if (!table || !id) {
      return NextResponse.json({ error: "Table and ID are required" }, { status: 400 })
    }
    
    // Determine which table to update
    let tableName = ""
    switch (table) {
      case "section":
        tableName = "custom_lists"
        break
      case "setting":
        tableName = "system_settings"
        break
      case "school":
        tableName = "school_info"
        break
      default:
        return NextResponse.json({ error: "Invalid table" }, { status: 400 })
    }
    
    // Add updated_at timestamp
    const updateData = { ...updates, updated_at: new Date().toISOString() }
    
    // Use update() with eq() which returns an array, handle accordingly
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", id)
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Fetch the updated record
    const { data: updated, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", id)
      .single()
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { table, ...data } = await request.json()
    
    if (!table) {
      return NextResponse.json({ error: "Table is required" }, { status: 400 })
    }
    
    // Determine which table to insert into
    let tableName = ""
    switch (table) {
      case "section":
        tableName = "custom_lists"
        break
      case "setting":
        tableName = "system_settings"
        break
      case "school":
        tableName = "school_info"
        break
      default:
        return NextResponse.json({ error: "Invalid table" }, { status: 400 })
    }
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Insert error:", error)
    return NextResponse.json({ error: "Failed to insert" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get("table")
    const id = searchParams.get("id")
    
    if (!table || !id) {
      return NextResponse.json({ error: "Table and ID are required" }, { status: 400 })
    }
    
    let tableName = ""
    switch (table) {
      case "section":
        tableName = "custom_lists"
        break
      case "setting":
        tableName = "system_settings"
        break
      case "school":
        tableName = "school_info"
        break
      default:
        return NextResponse.json({ error: "Invalid table" }, { status: 400 })
    }
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
