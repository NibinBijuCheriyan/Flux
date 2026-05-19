import { useState } from 'react'
import { Globe, ExternalLink, Loader2, AlertCircle, User, Lock, Copy, Check } from 'lucide-react'
import { useServices } from '../../hooks/useServices'

export function ServiceDirectory() {
    const { services, loading, error } = useServices()
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const copyToClipboard = async (text: string, fieldId: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(fieldId)
            setTimeout(() => setCopiedField(null), 2000)
        } catch {
            alert('Failed to copy to clipboard')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600 font-medium">Loading services...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Service Directory</h2>
                    <p className="text-sm text-gray-500">Quick access to external portals and services</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {services.length === 0 ? (
                <div className="card text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-8 h-8 text-teal-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h3>
                    <p className="text-gray-500">Your manager hasn't added any service links yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                        <div key={service.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
                            {/* Service Info */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                                    {service.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>}
                                </div>
                            </div>

                            {/* Credentials with Copy */}
                            {(service.username || service.password) && (
                                <div className="mb-4 p-3 bg-gray-50/80 rounded-lg border border-gray-100 space-y-2">
                                    {service.username && (
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 text-sm min-w-0">
                                                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="text-gray-500 flex-shrink-0">User:</span>
                                                <span className="font-mono text-gray-800 font-medium truncate">{service.username}</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(service.username!, `user-${service.id}`)}
                                                className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                                                title="Copy username"
                                            >
                                                {copiedField === `user-${service.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                                            </button>
                                        </div>
                                    )}
                                    {service.password && (
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 text-sm min-w-0">
                                                <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="text-gray-500 flex-shrink-0">Pass:</span>
                                                <span className="font-mono text-gray-800 font-medium truncate">{service.password}</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(service.password!, `pass-${service.id}`)}
                                                className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                                                title="Copy password"
                                            >
                                                {copiedField === `pass-${service.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Open Portal Button */}
                            <div className="mt-auto">
                                <a
                                    href={service.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all font-medium shadow-md hover:shadow-lg"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Portal
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
