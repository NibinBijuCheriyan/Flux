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

    const addEmployee = async (email: string, managerId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        email,
                        role: 'employee',
                        added_by: managerId,
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
        removeEmployee,
        refetch: fetchUsers,
    }
}
