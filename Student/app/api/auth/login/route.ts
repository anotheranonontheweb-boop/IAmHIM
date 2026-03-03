import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.findUserByEmail(email)

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Determine user type and role
    let userRole: string
    let redirectPath: string
    
    if (user.userType === 'teacher') {
      // Teacher user
      userRole = (user as any).role
      redirectPath = userRole === 'admin' ? '/admin' : '/teacher'
    } else {
      // Student user
      userRole = 'student'
      redirectPath = '/student'
    }

    // Get additional data based on role
    let stats = null
    let teacherData = null
    let teacherSection = null
    
    if (user.userType === 'user') {
      stats = await db.findStatsByUserId(user.id)
    } else if (user.userType === 'teacher') {
      teacherData = await db.findTeacherById(user.id)
      // Get the section this teacher is assigned to
      if (teacherData) {
        // First try to get from sections table
        const section = await db.getSectionByAdviser(user.id)
        teacherSection = section?.section_name || null
        
        // Fallback: check if teacher has a section_id field
        if (!teacherSection && (teacherData as any).section_id) {
          teacherSection = (teacherData as any).section_id
        }
      }
    }

    // Build response data based on user type
    const responseData: any = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
      },
      stats: stats || {},
      teacherData: teacherData,
      redirectPath: redirectPath,
    }

    // Add student-specific fields
    if (user.userType === 'user') {
      responseData.user.grade = user.grade
      responseData.user.avatar = user.avatar
      responseData.user.section_id = user.section_id
    } else if (user.userType === 'teacher') {
      responseData.user.subject = (user as any).subject
      responseData.user.employee_id = (user as any).employee_id
      responseData.user.avatar = (user as any).avatar
      responseData.user.section = teacherSection
    }

    const response = NextResponse.json(responseData)

    // Set session cookie
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      userType: user.userType,
    }
    
    response.cookies.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
