import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Fetch all tables
    const [
      usersData,
      teachersData,
      userStatsData,
      activitiesData,
      sectionsData,
      attendanceSessionsData,
      attendanceRecordsData,
      studentQrTokensData
    ] = await Promise.all([
      supabase.from('users').select('*').order('id', { ascending: true }),
      supabase.from('teachers').select('*').order('id', { ascending: true }),
      supabase.from('user_stats').select('*').order('id', { ascending: true }),
      supabase.from('activities').select('*').order('id', { ascending: true }),
      supabase.from('sections').select('*').order('id', { ascending: true }),
      supabase.from('attendance_sessions').select('*').order('id', { ascending: true }),
      supabase.from('attendance_records').select('*').order('id', { ascending: true }),
      supabase.from('student_qr_tokens').select('*').order('id', { ascending: true }),
    ])

    return NextResponse.json({
      success: true,
      tables: {
        users: {
          name: 'users',
          count: usersData.data?.length || 0,
          columns: ['id', 'name', 'email', 'password', 'grade', 'avatar', 'enrolled_date', 'role', 'section_id', 'employee_id', 'subject'],
          data: usersData.data || []
        },
        teachers: {
          name: 'teachers',
          count: teachersData.data?.length || 0,
          columns: ['id', 'name', 'email', 'password', 'subject', 'employee_id', 'role', 'avatar', 'hire_date', 'is_active'],
          data: teachersData.data || []
        },
        user_stats: {
          name: 'user_stats',
          count: userStatsData.data?.length || 0,
          columns: ['id', 'user_id', 'streak', 'points', 'total_points', 'class_rank', 'total_rank'],
          data: userStatsData.data || []
        },
        activities: {
          name: 'activities',
          count: activitiesData.data?.length || 0,
          columns: ['id', 'user_id', 'type', 'description', 'points_earned', 'created_at'],
          data: activitiesData.data || []
        },
        sections: {
          name: 'sections',
          count: sectionsData.data?.length || 0,
          columns: ['id', 'section_name', 'grade_level', 'adviser_id', 'created_at', 'is_active'],
          data: sectionsData.data || []
        },
        attendance_sessions: {
          name: 'attendance_sessions',
          count: attendanceSessionsData.data?.length || 0,
          columns: ['id', 'session_name', 'section_id', 'created_by', 'created_at', 'is_active', 'expires_at'],
          data: attendanceSessionsData.data || []
        },
        attendance_records: {
          name: 'attendance_records',
          count: attendanceRecordsData.data?.length || 0,
          columns: ['id', 'session_id', 'user_id', 'student_name', 'grade', 'scanned_at', 'scan_method', 'status', 'device_info'],
          data: attendanceRecordsData.data || []
        },
        student_qr_tokens: {
          name: 'student_qr_tokens',
          count: studentQrTokensData.data?.length || 0,
          columns: ['id', 'user_id', 'token', 'created_at', 'expires_at', 'is_active'],
          data: studentQrTokensData.data || []
        }
      },
      summary: {
        totalUsers: usersData.data?.length || 0,
        totalTeachers: teachersData.data?.length || 0,
        totalSections: sectionsData.data?.length || 0,
        totalAttendanceRecords: attendanceRecordsData.data?.length || 0,
        totalSessions: attendanceSessionsData.data?.length || 0
      }
    })
  } catch (error) {
    console.error('Error fetching database:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
