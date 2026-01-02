import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Token } from '../lib/types'

export function useTokens() {
    const [tokens, setTokens] = useState<Token[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTokens = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('tokens')
                .select('*')
                .order('generated_at', { ascending: false })

            if (error) throw error
            setTokens(data || [])
        } catch (error) {
            console.error('Error fetching tokens:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTokens()
    }, [])

    const generateToken = async (
        customerName: string,
        customerPhone: string,
        userId: string,
        notes?: string
    ) => {
        try {
            // Generate unique token ID
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
            const random = Math.floor(1000 + Math.random() * 9000)
            const tokenId = `TKN-${date}-${random}`

            const { data, error } = await supabase
                .from('tokens')
                .insert([
                    {
                        token_id: tokenId,
                        customer_name: customerName,
                        customer_phone: customerPhone,
                        notes: notes,
                        generated_by: userId,
                        status: 'active',
                    },
                ])
                .select()
                .single()

            if (error) throw error
            await fetchTokens()
            return { data, error: null }
        } catch (error: any) {
            return { data: null, error }
        }
    }

    const validateToken = async (tokenId: string) => {
        try {
            const { data, error } = await supabase
                .from('tokens')
                .select('*')
                .eq('token_id', tokenId)
                .eq('status', 'active')
                .single()

            if (error || !data) {
                return {
                    valid: false,
                    error: 'Token not found or already used',
                    customerName: '',
                    customerPhone: '',
                }
            }

            return {
                valid: true,
                error: null,
                customerName: data.customer_name,
                customerPhone: data.customer_phone,
            }
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid token',
                customerName: '',
                customerPhone: '',
            }
        }
    }

    const markTokenAsUsed = async (tokenId: string) => {
        try {
            const { error } = await supabase
                .from('tokens')
                .update({
                    status: 'used',
                    used_at: new Date().toISOString(),
                })
                .eq('token_id', tokenId)

            if (error) throw error
            await fetchTokens()
            return { error: null }
        } catch (error: any) {
            return { error }
        }
    }

    const searchTokensByPhone = async (phone: string) => {
        try {
            const { data, error } = await supabase
                .from('tokens')
                .select('*')
                .ilike('customer_phone', `%${phone}%`)
                .order('generated_at', { ascending: false })

            if (error) throw error
            return { data: data || [], error: null }
        } catch (error: any) {
            return { data: [], error }
        }
    }

    const cancelToken = async (tokenId: string) => {
        try {
            const { error } = await supabase
                .from('tokens')
                .update({ status: 'cancelled' })
                .eq('id', tokenId)

            if (error) throw error
            await fetchTokens()
            return { error: null }
        } catch (error: any) {
            return { error }
        }
    }

    return {
        tokens,
        loading,
        generateToken,
        validateToken,
        markTokenAsUsed,
        searchTokensByPhone,
        cancelToken,
        refetch: fetchTokens,
    }
}
