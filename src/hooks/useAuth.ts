import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AuthUser } from '../lib/types'

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Restore session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session?.user) {
                fetchUserProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Keep session state in sync with Supabase auth events
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session?.user) {
                fetchUserProfile(session.user.id)
            } else {
                setUser(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    /**
     * Fetches the public.users profile for the currently authenticated user.
     * Uses select('*') so it works whether or not center_id column exists yet.
     */
    const fetchUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error || !data) {
                setUser(null)
            } else {
                setUser({
                    id: data.id,
                    email: data.email,
                    role: data.role,
                    center_id: data.center_id ?? null,
                })
            }
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        return { data, error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    return { user, session, loading, signIn, signOut }
}
