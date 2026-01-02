import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FormEntry } from '../lib/types'

export function useFormEntries() {
    const [entries, setEntries] = useState<FormEntry[]>([])
    const [loading, setLoading] = useState(true)

    const fetchEntries = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('form_entries')
                .select('*')
                .order('submitted_at', { ascending: false })

            if (error) throw error
            setEntries(data || [])
        } catch (error) {
            console.error('Error fetching entries:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEntries()
    }, [])

    const addEntry = async (entry: Omit<FormEntry, 'id' | 'submitted_at'>) => {
        try {
            const { data, error } = await supabase
                .from('form_entries')
                .insert([entry])
                .select()

            if (error) throw error
            await fetchEntries()
            return { data, error: null }
        } catch (error: any) {
            return { data: null, error }
        }
    }

    return {
        entries,
        loading,
        addEntry,
        refetch: fetchEntries,
    }
}
