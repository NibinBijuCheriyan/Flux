import { useState } from 'react'
import { LayoutDashboard, Users, Ticket, FileText, Database, Building2, Check, Loader2, Pencil } from 'lucide-react'
import { useFormEntries } from '../../hooks/useFormEntries'
import { useTokens } from '../../hooks/useTokens'
import { useUsers } from '../../hooks/useUsers'
import { EmployeeManagement } from './EmployeeManagement'
import { AllDataView } from './AllDataView'
import { TokenGenerator } from '../shared/TokenGenerator'
import { TokenHistory } from '../shared/TokenHistory'
import { FormEntry } from '../shared/FormEntry'
import { UI_STRINGS } from '../../lib/uiStrings'
import { useCenterName } from '../../hooks/useCenterName'

type Tab = 'overview' | 'employees' | 'tokens' | 'form' | 'data'

const S = UI_STRINGS.manager.dashboard

export function ManagerDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const { entries } = useFormEntries()
    const { tokens } = useTokens()
    const { users } = useUsers()
    const { centerName, loading: centerLoading, updateCenterName } = useCenterName()
    const [editingCenterName, setEditingCenterName] = useState(false)
    const [newCenterName, setNewCenterName] = useState('')
    const [savingCenterName, setSavingCenterName] = useState(false)

    const employees = users.filter((u) => u.role === 'employee')
    const activeTokens = tokens.filter((t) => t.status === 'active')
    const thisMonthEntries = entries.filter(
        (e) =>
            new Date(e.submitted_at).getMonth() === new Date().getMonth() &&
            new Date(e.submitted_at).getFullYear() === new Date().getFullYear()
    )

    const tabs = [
        { id: 'overview' as Tab, label: S.tabs.overview, icon: LayoutDashboard },
        { id: 'employees' as Tab, label: S.tabs.employees, icon: Users },
        { id: 'tokens' as Tab, label: S.tabs.tokens, icon: Ticket },
        { id: 'form' as Tab, label: S.tabs.form, icon: FileText },
        { id: 'data' as Tab, label: S.tabs.data, icon: Database },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{S.heading}</h1>
                <p className="text-gray-600">{S.subtitle}</p>
            </div>

            {/* Tabs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-2">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="stat-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                    <Ticket className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="stat-value">{activeTokens.length}</div>
                            <div className="stat-label">{S.stats.activeTokens}</div>
                            <div className="stat-change text-green-600">{S.stats.activeTokensHint}</div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                    <Database className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="stat-value">{entries.length}</div>
                            <div className="stat-label">{S.stats.totalEntries}</div>
                            <div className="stat-change text-blue-600">{S.stats.totalEntriesHint}</div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="stat-value">{employees.length}</div>
                            <div className="stat-label">{S.stats.activeEmployees}</div>
                            <div className="stat-change text-green-600">{S.stats.activeEmployeesHint}</div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="stat-value">{thisMonthEntries.length}</div>
                            <div className="stat-label">{S.stats.thisMonth}</div>
                            <div className="stat-change text-blue-600">{S.stats.thisMonthHint}</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{S.quickActions.heading}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setActiveTab('employees')}
                                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:shadow-lg transition-all duration-200 text-left group"
                            >
                                <Users className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900">{S.quickActions.manageEmployees}</h3>
                                <p className="text-sm text-gray-600">{S.quickActions.manageEmployeesDesc}</p>
                            </button>

                            <button
                                onClick={() => setActiveTab('tokens')}
                                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg hover:shadow-lg transition-all duration-200 text-left group"
                            >
                                <Ticket className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900">{S.quickActions.generateTokens}</h3>
                                <p className="text-sm text-gray-600">{S.quickActions.generateTokensDesc}</p>
                            </button>

                            <button
                                onClick={() => setActiveTab('form')}
                                className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg hover:shadow-lg transition-all duration-200 text-left group"
                            >
                                <FileText className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900">{S.quickActions.submitEntry}</h3>
                                <p className="text-sm text-gray-600">{S.quickActions.submitEntryDesc}</p>
                            </button>

                            <button
                                onClick={() => setActiveTab('data')}
                                className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg hover:shadow-lg transition-all duration-200 text-left group"
                            >
                                <Database className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900">{S.quickActions.viewAllData}</h3>
                                <p className="text-sm text-gray-600">{S.quickActions.viewAllDataDesc}</p>
                            </button>
                        </div>
                    </div>

                    {/* Center Settings */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Center Settings</h2>
                                <p className="text-sm text-gray-500">This name appears on all printed bills and receipts</p>
                            </div>
                        </div>

                        {centerLoading ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                            </div>
                        ) : editingCenterName ? (
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={newCenterName}
                                    onChange={(e) => setNewCenterName(e.target.value)}
                                    className="input flex-1"
                                    placeholder="Enter center name"
                                    autoFocus
                                />
                                <button
                                    onClick={async () => {
                                        if (!newCenterName.trim()) return
                                        setSavingCenterName(true)
                                        const { error } = await updateCenterName(newCenterName)
                                        setSavingCenterName(false)
                                        if (error) {
                                            alert('Failed to update center name: ' + (error.message || error))
                                        } else {
                                            setEditingCenterName(false)
                                        }
                                    }}
                                    disabled={savingCenterName || !newCenterName.trim()}
                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                                >
                                    {savingCenterName ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingCenterName(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Center Name</p>
                                    <p className="text-lg font-semibold text-gray-900 mt-0.5">{centerName}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setNewCenterName(centerName)
                                        setEditingCenterName(true)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-violet-300 text-violet-700 rounded-lg hover:bg-violet-50 transition-colors font-medium shadow-sm"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'employees' && <EmployeeManagement />}

            {activeTab === 'tokens' && (
                <div className="space-y-6">
                    <TokenGenerator />
                    <TokenHistory />
                </div>
            )}

            {activeTab === 'form' && <FormEntry />}

            {activeTab === 'data' && <AllDataView />}
        </div>
    )
}
