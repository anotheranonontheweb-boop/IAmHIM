import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const section = searchParams.get("section")

    let query = supabase
      .from("attendance_records")
      .select("*")
      .order("scanned_at", { ascending: false })

    if (date) {
      const startOfDay = `${date}T00:00:00`
      const endOfDay = `${date}T23:59:59`
      query = query.gte("scanned_at", startOfDay).lte("scanned_at", endOfDay)
    }

    if (section) {
      query = query.eq("grade", section)
    }

    const { data: records, error } = await query

    if (error) {
      console.error("[v0] Attendance fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
    }

    return NextResponse.json({ records: records || [] })
  } catch (error) {
    console.error("[v0] Teacher attendance error:", error)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, studentName, grade, status, scanMethod, updateId, absentReason, absenceType } = body

    // If updateId is provided, update that specific record
    if (updateId) {
      const numericUpdateId = parseInt(updateId)
      console.log("[v0] Updating record ID:", numericUpdateId, "to status:", status)
      
      const updateData: any = {
        status: status || "present",
        scanned_at: new Date().toISOString(),
      }

      // Add absent reason and type if status is absent and fields have values
      if (status === "absent" && (absentReason || absenceType)) {
        if (absentReason) updateData.absent_reason = absentReason
        if (absenceType) updateData.absence_type = absenceType
      } else if (status !== "absent") {
        // Clear absent reason if status is not absent (only if columns exist)
        updateData.absent_reason = null
        updateData.absence_type = null
      }

      const { data: record, error } = await supabase
        .from("attendance_records")
        .update(updateData)
        .eq("id", numericUpdateId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Attendance update error:", error)
        return NextResponse.json({ error: "Failed to update attendance: " + error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        record,
        message: "Attendance updated",
        updated: true 
      })
    }

    if (!sessionId || !userId || !studentName || !grade) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if attendance already recorded today for this student
    const today = new Date().toISOString().split("T")[0]
    const startOfDay = `${today}T00:00:00`
    const endOfDay = `${today}T23:59:59`

    const { data: existingRecord } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("user_id", userId)
      .gte("scanned_at", startOfDay)
      .lte("scanned_at", endOfDay)
      .single()

    if (existingRecord) {
      // Update existing record
      const updateData: any = {
        status: status || "present",
        scanned_at: new Date().toISOString(),
      }

      // Add absent reason and type if status is absent and fields have values
      if (status === "absent" && (absentReason || absenceType)) {
        if (absentReason) updateData.absent_reason = absentReason
        if (absenceType) updateData.absent_type = absenceType
      } else if (status !== "absent") {
        updateData.absent_reason = null
        updateData.absence_type = null
      }

      const { data: record, error } = await supabase
        .from("attendance_records")
        .update(updateData)
        .eq("id", existingRecord.id)
        .select()
        .single()

      if (error) {
        console.error("[v0] Attendance update error:", error)
        return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        record,
        message: "Attendance updated",
        updated: true 
      })
    }

    // Create new record
    const insertData: any = {
      session_id: sessionId,
      user_id: userId,
      student_name: studentName,
      grade: grade,
      status: status || "present",
      scan_method: scanMethod || "manual",
      scanned_at: new Date().toISOString(),
    }

    // Add absent reason and type if status is absent and fields have values
    if (status === "absent" && (absentReason || absenceType)) {
      if (absentReason) insertData.absent_reason = absentReason
      if (absenceType) insertData.absence_type = absenceType
    }

    const { data: record, error } = await supabase
      .from("attendance_records")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Attendance insert error:", error)
      return NextResponse.json({ error: "Failed to record attendance: " + error.message }, { status: 500 })
    }

    // Add activity for attendance
    const db = await getDatabase()
    const numericUserId = parseInt(userId)
    const statusText = status === 'present' ? 'marked present' : status === 'late' ? 'marked as late' : 'marked as absent'
    await fetch('/api/recent-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: numericUserId,
        activity_type: status === 'present' ? 'attendance_present' : status === 'late' ? 'attendance_late' : 'attendance_absent',
        title: status === 'present' ? 'Attendance Marked' : status === 'late' ? 'Late Arrival' : 'Absent',
        description: `You were ${statusText} by your teacher`,
        icon: status === 'present' ? 'fa-calendar-check' : status === 'late' ? 'fa-clock' : 'fa-user-slash',
        icon_color: status === 'present' ? '#22c55e' : status === 'late' ? '#f97316' : '#ef4444',
        points: status === 'present' ? 10 : status === 'late' ? 5 : 0
      })
    }).catch(err => console.error('Failed to add activity:', err))

    return NextResponse.json({ success: true, record, created: true })
  } catch (error) {
    console.error("[v0] Teacher attendance POST error:", error)
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordId, status, absentReason, absenceType } = body

    if (!recordId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const numericRecordId = parseInt(recordId)
    console.log("[v0] Updating record:", numericRecordId, "to status:", status)

    const updateData: any = { 
      status: status,
      scanned_at: new Date().toISOString()
    }

    // Add absent reason and type if status is absent and fields have values
    if (status === "absent" && (absentReason || absenceType)) {
      if (absentReason) updateData.absent_reason = absentReason
      if (absenceType) updateData.absence_type = absenceType
    } else if (status !== "absent") {
      updateData.absent_reason = null
      updateData.absence_type = null
    }

    const { data: record, error } = await supabase
      .from("attendance_records")
      .update(updateData)
      .eq("id", numericRecordId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Attendance update error:", error)
      return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
    }

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error("[v0] Teacher attendance PUT error:", error)
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get("id")

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("id", parseInt(recordId))

    if (error) {
      console.error("[v0] Attendance delete error:", error)
      return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Teacher attendance DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 })
  }
}
