import { supabase } from '../lib/supabase'
import { useTokensContext } from '../context/TokensContext'

export function useTokens() {
    const { tokens, loading, refreshTokens } = useTokensContext()

    const generateToken = async (
        customerName: string,
        customerPhone: string,
        userId: string,
        notes?: string
    ) => {
        try {
            // SMART TOKEN GENERATION
            // We encode the data directly into the token ID
            // Format: FLX-[Base64EncodedData]
            // Data: { n: name, p: phone, r: random_suffix }

            const payload = {
                n: customerName,
                p: customerPhone,
                r: Math.floor(Math.random() * 10000) // Access code / Uniqueifier
            }

            // Create Base64 string (browser compatible)
            const jsonString = JSON.stringify(payload)
            const encoded = btoa(jsonString)
            const tokenId = `FLX-${encoded}`

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
            // Context updates via Realtime
            return { data, error: null }
        } catch (error: any) {
            return { data: null, error }
        }
    }

    const validateToken = async (tokenId: string) => {
        // 1. SMART DECODE (Fully Offline/Instant Validation)
        // We try to read the token string itself.
        if (tokenId.startsWith('FLX-')) {
            try {
                const encoded = tokenId.replace('FLX-', '')
                const jsonString = atob(encoded)
                const payload = JSON.parse(jsonString)

                console.log('Smart Token Decoded Instantly:', payload)

                // We have the data! Now just check if it's technically "active" in our cache
                // But even if cache is stale, we trust this structure first for the UI filling
                const localToken = tokens.find(t => t.token_id === tokenId)

                if (localToken && localToken.status !== 'active') {
                    return {
                        valid: false,
                        error: 'Token has already been used',
                        customerName: '',
                        customerPhone: ''
                    }
                }

                return {
                    valid: true,
                    error: null,
                    customerName: payload.n,
                    customerPhone: payload.p,
                }
            } catch (e) {
                console.error('Smart Token Decode Failed:', e)
                // Fallthrough to normal check if tampering detected
            }
        }

        // 2. Legacy Check (Global Memory)
        const localToken = tokens.find(t => t.token_id === tokenId && t.status === 'active')

        if (localToken) {
            return {
                valid: true,
                error: null,
                customerName: localToken.customer_name,
                customerPhone: localToken.customer_phone,
            }
        }

        // 3. Fallback to Server
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
            // Context updates via Realtime
            return { error: null }
        } catch (error: any) {
            return { error }
        }
    }

    const searchTokensByPhone = async (phone: string) => {
        // We can optimize this too if needed, but server search is fine for historical lookups
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
            // Context updates via Realtime
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
        refetch: refreshTokens,
    }
}
