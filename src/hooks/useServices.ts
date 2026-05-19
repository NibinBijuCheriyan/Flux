import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ServiceLink } from '../lib/types'
import { useAuth } from './useAuth'

export function useServices() {
    const { user } = useAuth()
    const [services, setServices] = useState<ServiceLink[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchServices = async () => {
        if (!user?.center_id) {
            setServices([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('service_links')
                .select('*')
                .eq('center_id', user.center_id)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            setServices(data || [])
        } catch (err: any) {
            console.error('Error fetching services:', err)
            setError(err.message || 'Failed to fetch services')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchServices()
        }
    }, [user?.center_id])

    const addService = async (
        service: Omit<ServiceLink, 'id' | 'created_at'>
    ) => {
        try {
            const { data, error: insertError } = await supabase
                .from('service_links')
                .insert([service])
                .select()

            if (insertError) throw insertError
            await fetchServices()
            return { data, error: null }
        } catch (err: any) {
            return { data: null, error: err }
        }
    }

    const deleteService = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('service_links')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError
            await fetchServices()
            return { error: null }
        } catch (err: any) {
            return { error: err }
        }
    }

    return {
        services,
        loading,
        error,
        addService,
        deleteService,
        refetch: fetchServices,
    }
}
