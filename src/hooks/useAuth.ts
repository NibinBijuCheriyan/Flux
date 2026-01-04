import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AuthUser } from '../lib/types'

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            console.log('useAuth: getSession result', { session, error })
            setSession(session)
            if (session?.user) {
                console.log('useAuth: Session found, fetching role for', session.user.id)
                fetchUserRole(session.user.id, session.user.email!)
            } else {
                console.log('useAuth: No session found')
                setLoading(false)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('useAuth: Auth state change', _event, session)
            setSession(session)
            if (session?.user) {
                fetchUserRole(session.user.id, session.user.email!)
            } else {
                setUser(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchUserRole = async (userId: string, email: string) => {
        try {
            console.log('fetchUserRole: Starting fetch for', { userId, email })

            // First try to find by ID (ideal case)
            let { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            console.log('fetchUserRole: ID lookup result', { data, error })

            // If not found by ID, try finding by email (mismatch case)
            if (!data && email) {
                console.log('fetchUserRole: Attempting email lookup fallback')
                const { data: emailData, error: emailError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single()

                console.log('fetchUserRole: Email lookup result', { emailData, emailError })

                if (emailData) {
                    console.warn('User ID mismatch detected. Using email match.', emailData)
                    data = emailData
                }
            }

            if (error && !data) {
                console.error('Error fetching user role:', error)
                setUser(null)
            } else if (data) {
                console.log('fetchUserRole: User found, setting state', data)
                setUser({
                    id: data.id,
                    email: data.email,
                    role: data.role,
                })
            } else {
                console.log('fetchUserRole: No data found, user is null')
            }
        } catch (error) {
            console.error('Error in fetchUserRole:', error)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { data, error }
    }

    const signUp = async (email: string, password: string, role: 'manager' | 'employee') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { role }, // Pass role in metadata
                emailRedirectTo: window.location.origin,
            },
        })
        return { data, error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    return {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
    }
}
