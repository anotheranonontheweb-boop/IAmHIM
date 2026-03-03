import { supabase } from './supabase'

interface User {
  id: number
  name: string
  email: string
  password: string
  grade: string
  avatar: string
  enrolled_date: string
  role: 'student' | 'teacher' | 'admin'
  section_id?: string
  employee_id?: string
  subject?: string
}

interface Teacher {
  id: number
  name: string
  email: string
  password: string
  subject: string
  employee_id: string
  role: 'teacher' | 'admin'
  avatar: string
  hire_date?: string
  is_active: boolean
}

interface UserStats {
  id: number
  user_id: number
  streak: number
  points: number
  total_points: number
  class_rank: number
  total_rank: number
}

interface Activity {
  id: number
  user_id: number
  type: string
  description: string
  points_earned: number
  created_at: string
}

interface Section {
  id: number
  section_name: string
  grade_level: string
  adviser_id?: number
  created_at?: string
  is_active: boolean
}

// Initialize database tables with sample data
async function initializeDatabase() {
  // Check if users table is empty
  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
  
  if (count === 0) {
    // Insert sample users (students)
    const users = [
      {
        id: 1,
        name: "Alex Johnson",
        email: "alex@example.com",
        password: "password",
        grade: "10-A",
        avatar: "👨‍🎓",
        enrolled_date: new Date().toISOString(),
        role: "student",
        section_id: "10-A",
      },
      {
        id: 2,
        name: "Sarah Williams",
        email: "sarah@example.com",
        password: "password",
        grade: "10-B",
        avatar: "👩‍🎓",
        enrolled_date: new Date().toISOString(),
        role: "student",
        section_id: "10-B",
      },
      {
        id: 3,
        name: "Mike Chen",
        email: "mike@example.com",
        password: "password",
        grade: "10-A",
        avatar: "👨‍🎓",
        enrolled_date: new Date().toISOString(),
        role: "student",
        section_id: "10-A",
      },
    ]
    
    await supabase.from('users').upsert(users)
    
    // Insert sample stats
    const stats = [
      { id: 1, user_id: 1, streak: 12, points: 329, total_points: 1200, class_rank: 2, total_rank: 15 },
      { id: 2, user_id: 2, streak: 15, points: 450, total_points: 1500, class_rank: 1, total_rank: 8 },
      { id: 3, user_id: 3, streak: 8, points: 280, total_points: 950, class_rank: 3, total_rank: 22 },
    ]
    
    await supabase.from('user_stats').upsert(stats)
    
    // Insert sample activities
    const activities = [
      {
        id: 1,
        user_id: 1,
        type: "quiz_complete",
        description: "Completed Mathematics Quiz",
        points_earned: 50,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 2,
        type: "assignment_submit",
        description: "Submitted Science Project",
        points_earned: 75,
        created_at: new Date().toISOString(),
      },
    ]
    
    await supabase.from('activities').upsert(activities)
  }
}

export async function getDatabase() {
  await initializeDatabase()
  
  return {
    // User authentication - checks both users and teachers tables
    findUserByEmail: async (email: string) => {
      // First check users table
      const { data: userData } = await supabase.from('users').select('*').eq('email', email).single()
      if (userData) {
        return { ...userData, userType: 'user' } as User & { userType: 'user' }
      }
      
      // Then check teachers table
      const { data: teacherData } = await supabase.from('teachers').select('*').eq('email', email).single()
      if (teacherData) {
        return { ...teacherData, userType: 'teacher' } as Teacher & { userType: 'teacher' }
      }
      
      return null
    },
    
    findUserById: async (id: number) => {
      const { data } = await supabase.from('users').select('*').eq('id', id).single()
      return data as User | null
    },

    findTeacherById: async (id: number) => {
      const { data } = await supabase.from('teachers').select('*').eq('id', id).single()
      return data as Teacher | null
    },
    
    findStatsByUserId: async (userId: number) => {
      const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).single()
      return data as UserStats | null
    },
    
    findActivitiesByUserId: async (userId: number) => {
      const { data } = await supabase.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      return data as Activity[] | null
    },
    
    updateUserStats: async (userId: number, updates: Partial<UserStats>) => {
      const { data } = await supabase.from('user_stats').update(updates).eq('user_id', userId).select().single()
      return data as UserStats | null
    },
    
    addActivity: async (activity: Omit<Activity, "id">) => {
      // If the activity has points, add them to user_stats
      if (activity.points_earned && activity.points_earned > 0) {
        const { data: currentStats } = await supabase
          .from('user_stats')
          .select('points, total_points')
          .eq('user_id', activity.user_id)
          .single()
        
        if (currentStats) {
          const newPoints = (currentStats.points || 0) + activity.points_earned
          const newTotalPoints = (currentStats.total_points || 0) + activity.points_earned
          
          await supabase
            .from('user_stats')
            .update({ points: newPoints, total_points: newTotalPoints })
            .eq('user_id', activity.user_id)
        }
      }
      
      const { data } = await supabase.from('activities').insert(activity).select().single()
      return data as Activity | null
    },
    
    getAllUsers: async () => {
      const { data } = await supabase.from('users').select('*')
      return data as User[] | null
    },

    getAllTeachers: async () => {
      const { data } = await supabase.from('teachers').select('*')
      return data as Teacher[] | null
    },
    
    getAllStats: async () => {
      const { data } = await supabase.from('user_stats').select('*')
      return data as UserStats[] | null
    },

    // Section management
    getAllSections: async () => {
      const { data } = await supabase.from('sections').select('*').eq('is_active', true)
      return data as Section[] | null
    },

    getSectionById: async (id: number) => {
      const { data } = await supabase.from('sections').select('*').eq('id', id).single()
      return data as Section | null
    },

    getSectionByName: async (sectionName: string) => {
      const { data } = await supabase.from('sections').select('*').eq('section_name', sectionName).single()
      return data as Section | null
    },

    createSection: async (section: Omit<Section, 'id' | 'created_at'>) => {
      const { data } = await supabase.from('sections').insert(section).select().single()
      return data as Section | null
    },

    updateSection: async (id: number, updates: Partial<Section>) => {
      const { data } = await supabase.from('sections').update(updates).eq('id', id).select().single()
      return data as Section | null
    },

    deleteSection: async (id: number) => {
      await supabase.from('sections').update({ is_active: false }).eq('id', id)
    },

    // User management (for admin)
    createUser: async (user: Omit<User, 'id'>) => {
      const { data } = await supabase.from('users').insert(user).select().single()
      return data as User | null
    },

    updateUser: async (id: number, updates: Partial<User>) => {
      const { data } = await supabase.from('users').update(updates).eq('id', id).select().single()
      return data as User | null
    },

    deleteUser: async (id: number) => {
      await supabase.from('users').delete().eq('id', id)
    },

    // Teacher management (for admin)
    createTeacher: async (teacher: Omit<Teacher, 'id'>) => {
      const { data } = await supabase.from('teachers').insert(teacher).select().single()
      return data as Teacher | null
    },

    updateTeacher: async (id: number, updates: Partial<Teacher>) => {
      const { data } = await supabase.from('teachers').update(updates).eq('id', id).select().single()
      return data as Teacher | null
    },

    deleteTeacher: async (id: number) => {
      await supabase.from('teachers').delete().eq('id', id)
    },

    // Get students by section
    getStudentsBySection: async (sectionId: string) => {
      // Get students where section_id OR grade matches the section
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .or(`section_id.eq.${sectionId},grade.eq.${sectionId}`)
      
      return data as User[] | null
    },

    // Get teacher by section
    getAdviserBySection: async (sectionId: string) => {
      const { data: section } = await supabase.from('sections').select('adviser_id').eq('section_name', sectionId).single()
      if (section?.adviser_id) {
        const { data: teacher } = await supabase.from('teachers').select('*').eq('id', section.adviser_id).single()
        return teacher as Teacher | null
      }
      return null
    },

    // Get section by adviser ID
    getSectionByAdviser: async (adviserId: number) => {
      const { data: section } = await supabase.from('sections').select('*').eq('adviser_id', adviserId).single()
      return section as Section | null
    },

    // Get counts for dashboard
    getTotalStudents: async () => {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student')
      return count || 0
    },

    getTotalTeachers: async () => {
      const { count } = await supabase.from('teachers').select('*', { count: 'exact', head: true })
      return count || 0
    },
  }
}
