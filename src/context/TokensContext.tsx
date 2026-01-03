import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Token } from '../lib/types'

interface TokensContextType {
    tokens: Token[]
    loading: boolean
    refreshTokens: () => Promise<void>
}

const TokensContext = createContext<TokensContextType | undefined>(undefined)

export function TokensProvider({ children }: { children: React.ReactNode }) {
    const [tokens, setTokens] = useState<Token[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTokens = useCallback(async () => {
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
    }, [])

    useEffect(() => {
        fetchTokens()

        // Global Real-time subscription
        const channel = supabase
            .channel('global-tokens-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tokens',
                },
                (payload) => {
                    console.log('Global Real-time change detected:', payload)
                    fetchTokens()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchTokens])

    return (
        <TokensContext.Provider value={{ tokens, loading, refreshTokens: fetchTokens }}>
            {children}
        </TokensContext.Provider>
    )
}

export function useTokensContext() {
    const context = useContext(TokensContext)
    if (context === undefined) {
        throw new Error('useTokensContext must be used within a TokensProvider')
    }
    return context
}
