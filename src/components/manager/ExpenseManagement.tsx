import { useState, useMemo } from 'react'
import { Wallet, Trash2, Filter, Calendar, TrendingUp, IndianRupee, Loader2, AlertCircle } from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { useUsers } from '../../hooks/useUsers'
import { ExpenseTracker } from '../shared/ExpenseTracker'
import { ExpenseCategory } from '../../lib/types'

const CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
    rent:          { label: 'Rent',          emoji: '🏠', color: 'from-blue-500 to-indigo-500' },
    utilities:     { label: 'Utilities',     emoji: '💡', color: 'from-yellow-500 to-amber-500' },
    supplies:      { label: 'Supplies',      emoji: '📦', color: 'from-cyan-500 to-teal-500' },
    maintenance:   { label: 'Maintenance',   emoji: '🔧', color: 'from-gray-500 to-slate-600' },
    salary:        { label: 'Salary',        emoji: '💰', color: 'from-green-500 to-emerald-500' },
    transport:     { label: 'Transport',     emoji: '🚗', color: 'from-violet-500 to-purple-500' },
    food:          { label: 'Food',          emoji: '🍽️', color: 'from-orange-500 to-red-500' },
    miscellaneous: { label: 'Miscellaneous', emoji: '📎', color: 'from-pink-500 to-rose-500' },
}

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as ExpenseCategory[]

export function ExpenseManagement() {
    const { expenses, loading, error, deleteExpense } = useExpenses()
    const { users } = useUsers()
    const [filterCategory, setFilterCategory] = useState<ExpenseCategory | ''>('')
    const [filterFrom, setFilterFrom] = useState('')
    const [filterTo, setFilterTo] = useState('')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const getUserEmail = (uid: string) => users.find((u) => u.id === uid)?.email ?? 'Unknown'

    const filtered = useMemo(() => {
        let result = [...expenses]
        if (filterCategory) result = result.filter((e) => e.category === filterCategory)
        if (filterFrom) result = result.filter((e) => e.expense_date >= filterFrom)
        if (filterTo) result = result.filter((e) => e.expense_date <= filterTo)
        return result
    }, [expenses, filterCategory, filterFrom, filterTo])

    const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const now = new Date()
    const thisMonthTotal = expenses
        .filter((e) => {
            const d = new Date(e.expense_date)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        .reduce((s, e) => s + Number(e.amount), 0)
    const todayStr = now.toISOString().split('T')[0]
    const todayTotal = expenses.filter((e) => e.expense_date === todayStr).reduce((s, e) => s + Number(e.amount), 0)
    const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0)

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this expense?')) return
        setDeletingId(id)
        await deleteExpense(id)
        setDeletingId(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="card bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p>{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center">
                            <IndianRupee className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="stat-value">₹{totalAll.toLocaleString('en-IN')}</div>
                    <div className="stat-label">Total Expenses</div>
                    <div className="stat-change text-rose-600">All time</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="stat-value">₹{thisMonthTotal.toLocaleString('en-IN')}</div>
                    <div className="stat-label">This Month</div>
                    <div className="stat-change text-amber-600">{now.toLocaleString('default', { month: 'long' })}</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="stat-value">₹{todayTotal.toLocaleString('en-IN')}</div>
                    <div className="stat-label">Today</div>
                    <div className="stat-change text-green-600">{todayStr}</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="stat-value">{expenses.length}</div>
                    <div className="stat-label">Total Records</div>
                    <div className="stat-change text-violet-600">Logged expenses</div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Category Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ALL_CATEGORIES.map((cat) => {
                        const meta = CATEGORY_META[cat]
                        const catTotal = expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0)
                        const count = expenses.filter((e) => e.category === cat).length
                        return (
                            <div key={cat} className="p-3 rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{meta.emoji}</span>
                                    <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">₹{catTotal.toLocaleString('en-IN')}</div>
                                <div className="text-xs text-gray-500">{count} expense{count !== 1 ? 's' : ''}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Log New Expense */}
            <ExpenseTracker />

            {/* Filters */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | '')} className="input w-full">
                            <option value="">All Categories</option>
                            {ALL_CATEGORIES.map((c) => (
                                <option key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="input w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="input w-full" />
                    </div>
                </div>
                {(filterCategory || filterFrom || filterTo) && (
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing <strong>{filtered.length}</strong> expense{filtered.length !== 1 ? 's' : ''} — Total: <strong className="text-rose-600">₹{filteredTotal.toLocaleString('en-IN')}</strong>
                        </p>
                        <button onClick={() => { setFilterCategory(''); setFilterFrom(''); setFilterTo('') }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
                    </div>
                )}
            </div>

            {/* Expense Table */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Logged By</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        No expenses found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((exp) => {
                                    const meta = CATEGORY_META[exp.category as ExpenseCategory] ?? CATEGORY_META.miscellaneous
                                    return (
                                        <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{new Date(exp.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                                                    {meta.emoji} {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{exp.description || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{getUserEmail(exp.logged_by)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => handleDelete(exp.id)} disabled={deletingId === exp.id} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete expense">
                                                    {deletingId === exp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
