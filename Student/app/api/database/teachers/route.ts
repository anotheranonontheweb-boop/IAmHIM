import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get all teachers from the database
    const { data: teachers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher')
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      teachers: teachers || [],
      count: teachers?.length || 0
    })
  } catch (err) {
    console.error('Error fetching teachers:', err)
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}
