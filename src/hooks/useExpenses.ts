import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Expense } from '../lib/types'
import { useAuth } from './useAuth'

export function useExpenses() {
    const { user } = useAuth()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchExpenses = async () => {
        if (!user?.center_id) {
            setExpenses([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('expenses')
                .select('*')
                .eq('center_id', user.center_id)
                .order('expense_date', { ascending: false })

            if (fetchError) throw fetchError
            setExpenses(data || [])
        } catch (err: any) {
            console.error('Error fetching expenses:', err)
            setError(err.message || 'Failed to fetch expenses')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchExpenses()
        }
    }, [user?.center_id])

    const addExpense = async (
        expense: Omit<Expense, 'id' | 'created_at'>
    ) => {
        try {
            const { data, error: insertError } = await supabase
                .from('expenses')
                .insert([expense])
                .select()

            if (insertError) throw insertError
            await fetchExpenses()
            return { data, error: null }
        } catch (err: any) {
            return { data: null, error: err }
        }
    }

    const deleteExpense = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError
            await fetchExpenses()
            return { error: null }
        } catch (err: any) {
            return { error: err }
        }
    }

    return {
        expenses,
        loading,
        error,
        addExpense,
        deleteExpense,
        refetch: fetchExpenses,
    }
}
