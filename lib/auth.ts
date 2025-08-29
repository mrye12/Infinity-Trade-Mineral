import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  user?: any
}

// Client-side authentication functions
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      }
    }

    return {
      success: true,
      user: data.user,
    }
  } catch (err) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred during sign in',
      },
    }
  }
}

export async function signUpWithEmail(
  email: string, 
  password: string, 
  fullName?: string
): Promise<AuthResponse> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      }
    }

    return {
      success: true,
      user: data.user,
    }
  } catch (err) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred during sign up',
      },
    }
  }
}

export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      }
    }

    return {
      success: true,
    }
  } catch (err) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred during sign out',
      },
    }
  }
}

export async function getUser(): Promise<{ user: any | null; error?: AuthError }> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return {
        user: null,
        error: {
          message: error.message,
          code: error.name,
        },
      }
    }

    return { user }
  } catch (err) {
    return {
      user: null,
      error: {
        message: 'An unexpected error occurred getting user',
      },
    }
  }
}

// Server-side authentication functions need to be imported directly in server components

export async function getUserProfile(authUserId: string): Promise<User | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()

    if (error || !data) {
      return null
    }

    return data as User
  } catch (err) {
    return null
  }
}

// Server user profile function - use in server components only

export async function updateUserProfile(
  userId: string, 
  updates: Partial<Omit<User, 'id' | 'auth_user_id' | 'created_at' | 'updated_at'>>
): Promise<AuthResponse> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    return {
      success: true,
      user: data,
    }
  } catch (err) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred updating profile',
      },
    }
  }
}

// Role-based access helpers
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function isStaff(user: User | null): boolean {
  return user?.role === 'staff'
}

export function hasAccess(user: User | null, resource: string): boolean {
  if (!user) return false
  
  // Admin has access to everything
  if (isAdmin(user)) return true
  
  // Staff has limited access
  if (isStaff(user)) {
    const staffAllowedResources = ['documents', 'shipments']
    return staffAllowedResources.includes(resource)
  }
  
  return false
}
