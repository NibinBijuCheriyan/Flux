import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '../lib/types'

export function useUsers() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('is_active', true)
                .order('added_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    /**
     * Pre-creates an employee row in public.users for a given email.
     * The manager's center_id is passed so the new employee is immediately
     * linked to the correct center (used when a manager adds someone manually).
     */
    const addEmployee = async (email: string, managerId: string, centerId: string | null) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        email,
                        role: 'employee',
                        added_by: managerId,
                        center_id: centerId,   // Link to manager's center immediately
                        is_active: true,
                    },
                ])
                .select()

            if (error) throw error
            await fetchUsers()
            return { data, error: null }
        } catch (error: any) {
            return { data: null, error }
        }
    }

    /**
     * Approves a pending employee by assigning them to the manager's center.
     * Called when a manager clicks "Approve" on a user with center_id = null.
     */
    const approveEmployee = async (userId: string, centerId: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ center_id: centerId, is_active: true })
                .eq('id', userId)

            if (error) throw error
            await fetchUsers()
            return { error: null }
        } catch (error: any) {
            return { error }
        }
    }

    const removeEmployee = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: false })
                .eq('id', userId)

            if (error) throw error
            await fetchUsers()
            return { error: null }
        } catch (error: any) {
            return { error }
        }
    }

    return {
        users,
        loading,
        addEmployee,
        approveEmployee,
        removeEmployee,
        refetch: fetchUsers,
    }
}
