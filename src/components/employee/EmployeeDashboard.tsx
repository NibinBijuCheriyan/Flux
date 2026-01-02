import { useState } from 'react'
import { LayoutDashboard, Ticket, FileText, Calendar } from 'lucide-react'
import { useFormEntries } from '../../hooks/useFormEntries'
import { useTokens } from '../../hooks/useTokens'
import { useAuth } from '../../hooks/useAuth'
import { isToday } from 'date-fns'
import { TodayDataView } from './TodayDataView'
import { TokenGenerator } from '../shared/TokenGenerator'
import { TokenHistory } from '../shared/TokenHistory'
import { FormEntry } from '../shared/FormEntry'

type Tab = 'overview' | 'tokens' | 'form' | 'mydata'

export function EmployeeDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const { user } = useAuth()
    const { entries } = useFormEntries()
    const { tokens } = useTokens()

    // Employee can only see their own data
    const myEntries = entries.filter((e) => e.employee_id === user?.id)
    const myTodayEntries = myEntries.filter((e) => isToday(new Date(e.submitted_at)))
    const myTokens = tokens.filter((t) => t.generated_by === user?.id)

    const tabs = [
        { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
        { id: 'tokens' as Tab, label: 'Tokens', icon: Ticket },
        { id: 'form' as Tab, label: 'Submit Entry', icon: FileText },
        { id: 'mydata' as Tab, label: "Today's Entries", icon: Calendar },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Dashboard</h1>
                <p className="text-gray-600">Submit entries and track your work</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="stat-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="stat-value">{myEntries.length}</div>
                            <div className="stat-label">Total Submissions</div>
                            <div className="stat-change text-blue-600">All time</div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="stat-value">{myTodayEntries.length}</div>
                            <div className="stat-label">Today's Entries</div>
                            <div className="stat-change text-green-600">
                                {myTodayEntries.length > 0 ? 'Keep it up!' : 'Get started'}
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                    <Ticket className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="stat-value">{myTokens.length}</div>
                            <div className="stat-label">Tokens Generated</div>
                            <div className="stat-change text-purple-600">By you</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setActiveTab('tokens')}
                                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg hover:shadow-lg transition-all duration-200 text-left group"
                            >
                                <Ticket className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900">Generate Token</h3>
                                <p className="text-sm text-gray-600">Create a new access token</p>
                            </button>

                            <button
                                onClick={() => setActiveTab('form')}
                                className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg hover:shadow-lg transition-all duration-200 text-left group"
                            >
                                <FileText className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900">Submit Entry</h3>
                                <p className="text-sm text-gray-600">Fill out a customer form</p>
                            </button>

                            <button
                                onClick={() => setActiveTab('mydata')}
                                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:shadow-lg transition-all duration-200 text-left group"
                            >
                                <Calendar className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-gray-900">View Today's Work</h3>
                                <p className="text-sm text-gray-600">See your submissions today</p>
                            </button>
                        </div>
                    </div>

                    {/* Info Notice */}
                    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Data Access Notice</h3>
                                <p className="text-sm text-gray-700">
                                    As an employee, you can only view your entries from <strong>today</strong>.
                                    Previous days' data is not accessible. All your historical data is securely
                                    stored and visible to managers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tokens' && (
                <div className="space-y-6">
                    <TokenGenerator />
                    <TokenHistory />
                </div>
            )}

            {activeTab === 'form' && <FormEntry />}

            {activeTab === 'mydata' && <TodayDataView />}
        </div>
    )
}
