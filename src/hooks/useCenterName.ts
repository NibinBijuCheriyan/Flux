import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const DEFAULT_CENTER_NAME = 'Flux Service Center'

/**
 * Fetches the center name for the currently logged-in user's center.
 * Managers can update the name via `updateCenterName`.
 * Falls back to 'Flux Service Center' when no center is assigned.
 */
export function useCenterName() {
    const { user } = useAuth()
    const [centerName, setCenterName] = useState<string>(DEFAULT_CENTER_NAME)
    const [loading, setLoading] = useState(true)

    const fetchCenterName = useCallback(async () => {
        if (!user?.center_id) {
            setCenterName(DEFAULT_CENTER_NAME)
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('centers')
                .select('name')
                .eq('id', user.center_id)
                .single()

            if (error || !data) {
                setCenterName(DEFAULT_CENTER_NAME)
            } else {
                setCenterName(data.name || DEFAULT_CENTER_NAME)
            }
        } catch {
            setCenterName(DEFAULT_CENTER_NAME)
        } finally {
            setLoading(false)
        }
    }, [user?.center_id])

    useEffect(() => {
        fetchCenterName()
    }, [fetchCenterName])

    /**
     * Updates the center name in the database.
     * Only meaningful for managers who have a center_id.
     */
    const updateCenterName = async (newName: string): Promise<{ error: any }> => {
        if (!user?.center_id) {
            return { error: new Error('No center assigned') }
        }

        try {
            const { error } = await supabase
                .from('centers')
                .update({ name: newName.trim() })
                .eq('id', user.center_id)

            if (error) {
                return { error }
            }

            setCenterName(newName.trim())
            return { error: null }
        } catch (error) {
            return { error }
        }
    }

    return { centerName, loading, updateCenterName }
}
