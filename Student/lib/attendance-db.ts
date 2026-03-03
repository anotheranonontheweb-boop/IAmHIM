import { supabase } from './supabase'

interface AttendanceSession {
  id?: number
  session_name: string
  section_id?: string
  created_by: number
  created_at?: string
  is_active: boolean
  expires_at?: string
}

interface AttendanceRecord {
  id?: number
  session_id: number
  user_id: number
  student_name: string
  grade: string
  scanned_at: string
  scan_method: 'qr_code' | 'manual'
  status: 'present' | 'late' | 'early'
  device_info?: string
}

interface StudentQRToken {
  id?: number
  user_id: number
  token: string
  created_at: string
  expires_at: string
  is_active: boolean
}

// Initialize attendance tables with sample data
async function initializeAttendanceTables() {
  // Check if attendance_sessions table exists and has data
  const { count: sessionCount } = await supabase
    .from('attendance_sessions')
    .select('*', { count: 'exact', head: true })

  if (sessionCount === 0) {
    // Create sample attendance sessions
    const sessions = [
      {
        id: 1,
        session_name: 'Morning Check-in - ' + new Date().toLocaleDateString(),
        section_id: '10-A',
        created_by: 1,
        is_active: true,
        expires_at: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
      },
      {
        id: 2,
        session_name: 'Afternoon Check-in - ' + new Date().toLocaleDateString(),
        section_id: '10-A',
        created_by: 1,
        is_active: true,
        expires_at: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
      },
    ]
    
    await supabase.from('attendance_sessions').upsert(sessions)
  }
}

// Generate a secure unique token for QR codes
function generateSecureToken(userId: number): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const hash = Buffer.from(`${userId}-${timestamp}-${randomPart}`).toString('base64url')
  return `STU-${userId}-${hash}`
}

export async function getAttendanceDB() {
  await initializeAttendanceTables()
  
  return {
    // Create or get QR token for a student
    getOrCreateQRToken: async (userId: number) => {
      // Check if active token exists
      const { data: existingToken } = await supabase
        .from('student_qr_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()
      
      if (existingToken) {
        return existingToken as StudentQRToken
      }
      
      // Create new token
      const token = generateSecureToken(userId)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      
      const { data: newToken } = await supabase
        .from('student_qr_tokens')
        .insert({
          user_id: userId,
          token,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single()
      
      return newToken as StudentQRToken
    },

    // Get user ID from QR token
    getUserByQRToken: async (token: string) => {
      const { data: tokenData } = await supabase
        .from('student_qr_tokens')
        .select(`
          *,
          users (
            id,
            name,
            email,
            grade,
            avatar
          )
        `)
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()
      
      if (!tokenData || !tokenData.users) {
        return null
      }
      
      return {
        userId: tokenData.users.id,
        name: tokenData.users.name,
        email: tokenData.users.email,
        grade: tokenData.users.grade,
        avatar: tokenData.users.avatar,
      }
    },

    // Record attendance from QR scan
    recordAttendance: async (
      sessionId: number,
      userId: number,
      studentName: string,
      grade: string,
      scanMethod: 'qr_code' | 'manual' = 'qr_code'
    ) => {
      const today = new Date().toISOString().split('T')[0]
      
      // Check for duplicate scan on same day for same session
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single()
      
      if (existingRecord) {
        return {
          success: false,
          message: 'Already checked in today',
          record: existingRecord,
          duplicate: true,
        }
      }
      
      // Determine status based on time
      const now = new Date()
      const hour = now.getHours()
      const status: 'present' | 'late' | 'early' = hour < 8 ? 'early' : hour < 10 ? 'present' : 'late'
      
      const { data: newRecord } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          user_id: userId,
          student_name: studentName,
          grade,
          scanned_at: new Date().toISOString(),
          scan_method: scanMethod,
          status,
        })
        .select()
        .single()
      
      return {
        success: true,
        message: 'Attendance recorded successfully',
        record: newRecord,
        duplicate: false,
      }
    },

    // Get all active attendance sessions
    getActiveSessions: async () => {
      const { data } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      return data as AttendanceSession[] | null
    },

    // Create a new attendance session
    createSession: async (
      sessionName: string,
      sectionId: string,
      createdBy: number
    ) => {
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours
      
      const { data } = await supabase
        .from('attendance_sessions')
        .insert({
          session_name: sessionName,
          section_id: sectionId,
          created_by: createdBy,
          is_active: true,
          expires_at: expiresAt,
        })
        .select()
        .single()
      
      return data as AttendanceSession
    },

    // Get attendance records for a session
    getSessionRecords: async (sessionId: number) => {
      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', sessionId)
        .order('scanned_at', { ascending: true })
      
      return data as AttendanceRecord[] | null
    },

    // Get user's attendance history
    getUserAttendance: async (userId: number) => {
      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false })
      
      return data as AttendanceRecord[] | null
    },

    // Get session details by ID
    getSessionById: async (sessionId: number) => {
      const { data } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      return data as AttendanceSession | null
    },

    // Deactivate a session
    deactivateSession: async (sessionId: number) => {
      await supabase
        .from('attendance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
    },

    // Get attendance statistics for a user
    getUserAttendanceStats: async (userId: number) => {
      const { data: records } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('user_id', userId)
      
      if (!records || records.length === 0) {
        return {
          total: 0,
          present: 0,
          late: 0,
          early: 0,
          attendanceRate: 0,
        }
      }
      
      const total = records.length
      const present = records.filter(r => r.status === 'present').length
      const late = records.filter(r => r.status === 'late').length
      const early = records.filter(r => r.status === 'early').length
      
      return {
        total,
        present,
        late,
        early,
        attendanceRate: Math.round(((present + early) / total) * 100),
      }
    },
  }
}
