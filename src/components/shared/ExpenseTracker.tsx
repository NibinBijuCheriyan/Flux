import { useState } from 'react'
import { Wallet, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { useAuth } from '../../hooks/useAuth'
import { ExpenseCategory } from '../../lib/types'

const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
    { value: 'rent', label: 'Rent', emoji: '🏠' },
    { value: 'utilities', label: 'Utilities', emoji: '💡' },
    { value: 'supplies', label: 'Supplies', emoji: '📦' },
    { value: 'maintenance', label: 'Maintenance', emoji: '🔧' },
    { value: 'salary', label: 'Salary', emoji: '💰' },
    { value: 'transport', label: 'Transport', emoji: '🚗' },
    { value: 'food', label: 'Food', emoji: '🍽️' },
    { value: 'miscellaneous', label: 'Miscellaneous', emoji: '📎' },
]

export function ExpenseTracker() {
    const { user } = useAuth()
    const { addExpense } = useExpenses()
    const [category, setCategory] = useState<ExpenseCategory>('miscellaneous')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
    const [submitting, setSubmitting] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const resetForm = () => {
        setCategory('miscellaneous')
        setAmount('')
        setDescription('')
        setExpenseDate(new Date().toISOString().split('T')[0])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.center_id || !amount) return
        setSubmitting(true)
        setFeedback(null)

        const { error } = await addExpense({
            center_id: user.center_id,
            logged_by: user.id,
            category,
            amount: parseFloat(amount),
            description: description.trim() || null,
            expense_date: expenseDate,
        })

        setSubmitting(false)
        if (error) {
            setFeedback({ type: 'error', message: error.message || 'Failed to log expense' })
        } else {
            setFeedback({ type: 'success', message: 'Expense logged successfully!' })
            resetForm()
            setTimeout(() => setFeedback(null), 3000)
        }
    }

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Log Expense</h2>
                    <p className="text-sm text-gray-500">Record an operational expense for this center</p>
                </div>
            </div>

            {feedback && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 transition-all duration-300 ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span className="text-sm font-medium">{feedback.message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                type="button"
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${category === cat.value ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-orange-50 text-rose-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                                <span className="text-base">{cat.emoji}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹)</label>
                        <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="input w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Expense Date</label>
                        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required className="input w-full" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="E.g. Monthly electricity bill, printer toner refill..." rows={3} className="input w-full resize-none" />
                </div>

                <button type="submit" disabled={submitting || !amount} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Logging...</>) : (<><Plus className="w-5 h-5" />Log Expense</>)}
                </button>
            </form>
        </div>
    )
}
