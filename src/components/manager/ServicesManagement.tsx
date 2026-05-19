import { useState } from 'react'
import { Globe, Plus, Trash2, ExternalLink, Loader2, AlertCircle, User, Lock, X } from 'lucide-react'
import { useServices } from '../../hooks/useServices'
import { useAuth } from '../../hooks/useAuth'

export function ServicesManagement() {
    const { user } = useAuth()
    const { services, loading, error, addService, deleteService } = useServices()

    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [description, setDescription] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const resetForm = () => {
        setName(''); setUrl(''); setDescription(''); setUsername(''); setPassword('')
        setFormError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !url.trim() || !user?.center_id) return
        setSaving(true)
        setFormError(null)
        const { error: err } = await addService({
            center_id: user.center_id,
            name: name.trim(),
            url: url.trim(),
            description: description.trim() || null,
            username: username.trim() || null,
            password: password.trim() || null,
        })
        setSaving(false)
        if (err) { setFormError(err.message || 'Failed to add service') }
        else { resetForm(); setShowForm(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this service link?')) return
        setDeletingId(id)
        const { error: err } = await deleteService(id)
        setDeletingId(null)
        if (err) alert('Failed to delete: ' + (err.message || err))
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">External Services</h2>
                        <p className="text-sm text-gray-500">Manage service links for your center</p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm) }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm ${showForm ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 shadow-lg'}`}
                >
                    {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Service</>}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {/* Add Form */}
            {showForm && (
                <div className="card bg-gradient-to-br from-teal-50/80 to-cyan-50/80 border-2 border-teal-200/60">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Service</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name <span className="text-red-500">*</span></label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. CSC Portal" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL <span className="text-red-500">*</span></label>
                                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="input" placeholder="https://example.com" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input" placeholder="Brief description of this service" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"><span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Username</span></label>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input" placeholder="Login username (optional)" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"><span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Password</span></label>
                                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Login password (optional)" />
                            </div>
                        </div>
                        {formError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{formError}</span>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <button type="submit" disabled={saving || !name.trim() || !url.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all disabled:opacity-50 font-medium shadow-lg">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {saving ? 'Adding...' : 'Add Service'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Services Grid */}
            {services.length === 0 ? (
                <div className="card text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-8 h-8 text-teal-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Yet</h3>
                    <p className="text-gray-500 mb-4">Add external service links for your team to access quickly.</p>
                    <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all font-medium shadow-md">
                        <Plus className="w-4 h-4" /> Add First Service
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                        <div key={service.id} className="group relative bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                            <button onClick={() => handleDelete(service.id)} disabled={deletingId === service.id} className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" title="Delete service">
                                {deletingId === service.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-gray-900 truncate pr-8">{service.name}</h3>
                                    {service.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>}
                                </div>
                            </div>
                            {(service.username || service.password) && (
                                <div className="mb-3 p-3 bg-gray-50/80 rounded-lg border border-gray-100 space-y-1.5">
                                    {service.username && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-gray-500">User:</span>
                                            <span className="font-mono text-gray-800 font-medium">{service.username}</span>
                                        </div>
                                    )}
                                    {service.password && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-gray-500">Pass:</span>
                                            <span className="font-mono text-gray-800 font-medium">{service.password}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <a href={service.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium truncate">
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{service.url}</span>
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
