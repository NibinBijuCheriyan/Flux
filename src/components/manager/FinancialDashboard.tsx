import { useState, useMemo } from 'react'
import { 
    IndianRupee, 
    TrendingUp, 
    TrendingDown, 
    Receipt, 
    BadgeIndianRupee, 
    BarChart3,
    CreditCard,
    Banknote,
    CalendarDays,
    Wrench,
    Users,
    ArrowDownRight
} from 'lucide-react'
import { useFormEntries } from '../../hooks/useFormEntries'
import { useExpenses } from '../../hooks/useExpenses'
import { useUsers } from '../../hooks/useUsers'
import { ExpenseCategory } from '../../lib/types'

// ── helpers ──────────────────────────────────────────────────────────
type Period = 'today' | 'week' | 'month' | 'all'

const EXPENSE_CAT_META: Record<ExpenseCategory, { label: string; emoji: string }> = {
    rent:          { label: 'Rent',          emoji: '🏠' },
    utilities:     { label: 'Utilities',     emoji: '💡' },
    supplies:      { label: 'Supplies',      emoji: '📦' },
    maintenance:   { label: 'Maintenance',   emoji: '🔧' },
    salary:        { label: 'Salary',        emoji: '💰' },
    transport:     { label: 'Transport',     emoji: '🚗' },
    food:          { label: 'Food',          emoji: '🍽️' },
    miscellaneous: { label: 'Miscellaneous', emoji: '📎' },
}

function startOfDay(d: Date) { const r = new Date(d); r.setHours(0, 0, 0, 0); return r }

function filterByPeriod<T>(items: T[], dateKey: keyof T, period: Period): T[] {
    if (period === 'all') return items
    const now = startOfDay(new Date())
    return items.filter((item) => {
        const d = startOfDay(new Date(item[dateKey] as string))
        if (period === 'today') return d.getTime() === now.getTime()
        if (period === 'week') return d >= new Date(now.getTime() - 6 * 86400000)
        if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        return true
    })
}

function fmt(n: number) { return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

// ── component ────────────────────────────────────────────────────────
export function FinancialDashboard() {
    const { entries } = useFormEntries()
    const { expenses } = useExpenses()
    const { users } = useUsers()
    const [period, setPeriod] = useState<Period>('month')

    // ── period-filtered data ─────────────────────────────────────────
    const pEntries = useMemo(() => filterByPeriod(entries, 'submitted_at', period), [entries, period])
    const pExpenses = useMemo(() => filterByPeriod(expenses, 'expense_date', period), [expenses, period])

    // ── P&L metrics ──────────────────────────────────────────────────
    const totalTransactionAmount = pEntries.reduce((s, e) => s + Number(e.service_charge || 0) + Number(e.bank_charge || 0), 0)
    const serviceCharge          = pEntries.reduce((s, e) => s + Number(e.service_charge || 0), 0)
    
    const totalOnlinePayments    = pEntries
        .filter(e => e.payment_method === 'Card' || e.payment_method === 'UPI/Online')
        .reduce((s, e) => s + Number(e.service_charge || 0) + Number(e.bank_charge || 0), 0)
        
    const totalCashTransactions  = pEntries
        .filter(e => e.payment_method === 'Cash')
        .reduce((s, e) => s + Number(e.service_charge || 0) + Number(e.bank_charge || 0), 0)
        
    const totalExpenses          = pExpenses.reduce((s, e) => s + Number(e.amount), 0)

    // ── monthly trends ───────────────────────────────────────────────
    const monthlyTrends = useMemo(() => {
        const map = new Map<string, { rev: number; bank: number; exp: number }>()
        entries.forEach((e) => {
            const d = new Date(e.submitted_at)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const cur = map.get(key) || { rev: 0, bank: 0, exp: 0 }
            cur.rev += Number(e.service_charge || 0)
            cur.bank += Number(e.bank_charge || 0)
            map.set(key, cur)
        })
        expenses.forEach((e) => {
            const d = new Date(e.expense_date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const cur = map.get(key) || { rev: 0, bank: 0, exp: 0 }
            cur.exp += Number(e.amount)
            map.set(key, cur)
        })
        return [...map.entries()]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 12)
            .map(([month, d]) => ({ month, ...d, profit: d.rev - d.bank - d.exp }))
    }, [entries, expenses])

    // ── revenue by service type ──────────────────────────────────────
    const byService = useMemo(() => {
        const map = new Map<string, { count: number; total: number }>()
        pEntries.forEach((e) => {
            const svc = e.service_type || 'Unknown'
            const cur = map.get(svc) || { count: 0, total: 0 }
            cur.count++
            cur.total += Number(e.service_charge || 0)
            map.set(svc, cur)
        })
        return [...map.entries()]
            .map(([name, d]) => ({ name, ...d, avg: d.count ? d.total / d.count : 0 }))
            .sort((a, b) => b.total - a.total)
    }, [pEntries])

    // ── revenue by employee ──────────────────────────────────────────
    const byEmployee = useMemo(() => {
        const map = new Map<string, { count: number; revenue: number }>()
        pEntries.forEach((e) => {
            const cur = map.get(e.employee_id) || { count: 0, revenue: 0 }
            cur.count++
            cur.revenue += Number(e.service_charge || 0)
            map.set(e.employee_id, cur)
        })
        return [...map.entries()]
            .map(([id, d]) => ({
                id,
                email: users.find((u) => u.id === id)?.email ?? 'Unknown',
                ...d,
            }))
            .sort((a, b) => b.revenue - a.revenue)
    }, [pEntries, users])

    // ── expense category breakdown ───────────────────────────────────
    const expByCat = useMemo(() => {
        const map = new Map<ExpenseCategory, number>()
        pExpenses.forEach((e) => {
            map.set(e.category, (map.get(e.category) || 0) + Number(e.amount))
        })
        return [...map.entries()]
            .map(([cat, total]) => ({ cat, total, label: EXPENSE_CAT_META[cat]?.label ?? cat, emoji: EXPENSE_CAT_META[cat]?.emoji ?? '📎' }))
            .sort((a, b) => b.total - a.total)
    }, [pExpenses])

    // ── daily revenue (last 30 days) ─────────────────────────────────
    const dailyRevenue = useMemo(() => {
        const days: { date: string; total: number }[] = []
        const now = startOfDay(new Date())
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 86400000)
            const dateStr = d.toISOString().split('T')[0]
            days.push({ date: dateStr, total: 0 })
        }
        entries.forEach((e) => {
            const dateStr = new Date(e.submitted_at).toISOString().split('T')[0]
            const day = days.find((d) => d.date === dateStr)
            if (day) day.total += Number(e.service_charge || 0)
        })
        return days
    }, [entries])

    const maxDailyRev = Math.max(...dailyRevenue.map((d) => d.total), 1)

    const periodLabels: Record<Period, string> = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time' }

    // ── render ───────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex flex-wrap items-center gap-2">
                {(['today', 'week', 'month', 'all'] as Period[]).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${period === p
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white/80 text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {periodLabels[p]}
                    </button>
                ))}
            </div>

            {/* ── Hero P&L Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Transaction Amount */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <IndianRupee className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Total</span>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">{fmt(totalTransactionAmount)}</div>
                    <div className="stat-label">Total Transaction Amount</div>
                    <div className="stat-change text-emerald-600">{pEntries.length} transactions</div>
                </div>

                {/* Service Charge */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <BadgeIndianRupee className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Revenue</span>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">{fmt(serviceCharge)}</div>
                    <div className="stat-label">Service Charge</div>
                    <div className="stat-change text-blue-600">Core earnings</div>
                </div>

                {/* Total Online Payments */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Online</span>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">{fmt(totalOnlinePayments)}</div>
                    <div className="stat-label">Total Online Payments</div>
                    <div className="stat-change text-violet-600">UPI & Cards</div>
                </div>

                {/* Total Cash Transactions */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                            <Banknote className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Cash</span>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">{fmt(totalCashTransactions)}</div>
                    <div className="stat-label">Total Cash Transactions</div>
                    <div className="stat-change text-amber-600">Physical currency</div>
                </div>

                {/* Total Expenses */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/25">
                            <Receipt className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Spent</span>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">{fmt(totalExpenses)}</div>
                    <div className="stat-label">Total Expenses</div>
                    <div className="stat-change text-rose-600">{pExpenses.length} entries</div>
                </div>
            </div>

            {/* ── 30-Day Daily Revenue Sparkline ────────────────────── */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Daily Revenue</h3>
                        <p className="text-xs text-gray-500">Last 30 days</p>
                    </div>
                </div>
                <div className="flex items-end gap-[3px] h-32">
                    {dailyRevenue.map((d, i) => {
                        const pct = maxDailyRev > 0 ? (d.total / maxDailyRev) * 100 : 0
                        const isToday = i === dailyRevenue.length - 1
                        return (
                            <div key={d.date} className="flex-1 group relative flex flex-col justify-end h-full">
                                <div
                                    className={`w-full rounded-t-sm transition-all duration-300 ${isToday ? 'bg-gradient-to-t from-indigo-600 to-violet-500' : 'bg-gradient-to-t from-blue-400 to-indigo-400 opacity-70 group-hover:opacity-100'}`}
                                    style={{ height: `${Math.max(pct, 2)}%` }}
                                />
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                                    <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                                        <div className="font-bold">{fmt(d.total)}</div>
                                        <div className="text-gray-300">{new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                    <span>{new Date(dailyRevenue[0]?.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    <span>Today</span>
                </div>
            </div>

            {/* ── Monthly Trends Table ──────────────────────────────── */}
            {monthlyTrends.length > 0 && (
                <div className="card overflow-hidden p-0">
                    <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <CalendarDays className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Monthly Trends</h3>
                            <p className="text-xs text-gray-500">Last 12 months</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-y border-gray-200">
                                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Bank Charges</th>
                                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Expenses</th>
                                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Profit / Loss</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {monthlyTrends.map((m) => {
                                    const profit = m.profit
                                    const pos = profit >= 0
                                    const [yr, mo] = m.month.split('-')
                                    const label = new Date(Number(yr), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
                                    return (
                                        <tr key={m.month} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-5 py-3 text-sm font-medium text-gray-800">{label}</td>
                                            <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900">{fmt(m.rev)}</td>
                                            <td className="px-5 py-3 text-sm text-right text-amber-600">{fmt(m.bank)}</td>
                                            <td className="px-5 py-3 text-sm text-right text-rose-600">{fmt(m.exp)}</td>
                                            <td className={`px-5 py-3 text-sm text-right font-bold ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
                                                <span className="inline-flex items-center gap-1">
                                                    {pos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                                    {pos ? '' : '−'}{fmt(profit)}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Revenue by Service & by Employee (side-by-side) ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Service Type */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Revenue by Service</h3>
                            <p className="text-xs text-gray-500">{periodLabels[period]}</p>
                        </div>
                    </div>
                    {byService.length === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">No data for this period</p>
                    ) : (
                        <div className="max-h-[340px] overflow-y-auto pr-1">
                            <div className="space-y-3">
                                {byService.map((s, i) => {
                                    const pct = serviceCharge > 0 ? (s.total / serviceCharge) * 100 : 0
                                    return (
                                        <div key={s.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{s.name}</span>
                                                </div>
                                                <div className="text-sm font-bold text-gray-900">{fmt(s.total)}</div>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="flex justify-between mt-0.5">
                                                <span className="text-[10px] text-gray-400">{s.count} service{s.count !== 1 ? 's' : ''}</span>
                                                <span className="text-[10px] text-gray-400">Avg {fmt(s.avg)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* By Employee */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Revenue by Employee</h3>
                            <p className="text-xs text-gray-500">{periodLabels[period]}</p>
                        </div>
                    </div>
                    {byEmployee.length === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">No data for this period</p>
                    ) : (
                        <div className="max-h-[340px] overflow-y-auto pr-1">
                            <div className="space-y-3">
                                {byEmployee.map((emp, i) => {
                                    const pct = serviceCharge > 0 ? (emp.revenue / serviceCharge) * 100 : 0
                                    return (
                                        <div key={emp.id}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    {i === 0 && byEmployee.length > 1 && <span className="text-xs">🏆</span>}
                                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{emp.email}</span>
                                                </div>
                                                <div className="text-sm font-bold text-gray-900">{fmt(emp.revenue)}</div>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[10px] text-gray-400">{emp.count} entr{emp.count !== 1 ? 'ies' : 'y'}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Expense Category Breakdown ─────────────────────────── */}
            {expByCat.length > 0 && (
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <ArrowDownRight className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Where Money Goes</h3>
                            <p className="text-xs text-gray-500">Expense split — {periodLabels[period]}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {expByCat.map((c) => {
                            const pct = totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0
                            return (
                                <div key={c.cat}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{c.emoji}</span>
                                            <span className="text-sm font-medium text-gray-800">{c.label}</span>
                                            <span className="text-[10px] text-gray-400">{pct.toFixed(1)}%</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{fmt(c.total)}</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
