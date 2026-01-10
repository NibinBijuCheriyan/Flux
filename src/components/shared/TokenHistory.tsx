import { useState } from 'react'
import { format } from 'date-fns'
import { Search, Filter, XCircle } from 'lucide-react'
import { useTokens } from '../../hooks/useTokens'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

export function TokenHistory() {
    const { user } = useAuth()
    const { tokens, loading, cancelToken } = useTokens()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used' | 'cancelled'>('all')

    const filteredTokens = tokens.filter((token) => {
        const matchesSearch =
            token.token_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            token.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            token.customer_phone.includes(searchTerm)

        const matchesStatus = statusFilter === 'all' || token.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const handleCancelToken = async (tokenId: string) => {
        if (confirm('Are you sure you want to cancel this token?')) {
            const { error } = await cancelToken(tokenId)
            if (error) {
                alert('Error canceling token: ' + error.message)
            }
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Token History</h2>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by token ID, name, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="input"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="used">Used</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Token ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                No.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Generated
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Used At
                            </th>
                            {user?.role === 'manager' && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTokens.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    No tokens found
                                </td>
                            </tr>
                        ) : (
                            filteredTokens.map((token) => (
                                <tr key={token.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-mono text-sm font-medium text-gray-900">
                                            {token.token_id}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                        #{token.daily_number || '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {token.customer_name}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {token.customer_phone}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(token.generated_at), 'MMM dd, yyyy HH:mm')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {token.status === 'active' && (
                                            <span className="badge-success">Active</span>
                                        )}
                                        {token.status === 'used' && (
                                            <span className="badge-info">Used</span>
                                        )}
                                        {token.status === 'cancelled' && (
                                            <span className="badge-danger">Cancelled</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {token.used_at
                                            ? format(new Date(token.used_at), 'MMM dd, yyyy HH:mm')
                                            : '-'}
                                    </td>
                                    {user?.role === 'manager' && (
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {token.status === 'active' && (
                                                <button
                                                    onClick={() => handleCancelToken(token.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {tokens.filter((t) => t.status === 'active').length}
                    </p>
                    <p className="text-sm text-gray-500">Active Tokens</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                        {tokens.filter((t) => t.status === 'used').length}
                    </p>
                    <p className="text-sm text-gray-500">Used Tokens</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                        {tokens.filter((t) => t.status === 'cancelled').length}
                    </p>
                    <p className="text-sm text-gray-500">Cancelled Tokens</p>
                </div>
            </div>
        </div>
    )
}
