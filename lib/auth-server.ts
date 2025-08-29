import { createClient } from '@/lib/supabase/server'
import type { User } from '@/lib/types'

// Server-side authentication functions
export async function getServerUser() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (err) {
    return null
  }
}

export async function getServerUserProfile(authUserId: string): Promise<User | null> {
  try {
    const supabase = await createClient()
    
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
