import { useState } from 'react'
import { Users, Plus, Trash2, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { useUsers } from '../../hooks/useUsers'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI_STRINGS } from '../../lib/uiStrings'

const S = UI_STRINGS.manager.employeeManagement

export function EmployeeManagement() {
    const { user } = useAuth()
    const { users, loading, addEmployee, approveEmployee, removeEmployee } = useUsers()
    const [newEmail, setNewEmail] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    // Track which user IDs are currently being approved
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set())

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !newEmail) return

        setIsAdding(true)
        // Pass the manager's center_id so the new row is linked immediately
        const { error } = await addEmployee(newEmail, user.id, user.center_id)
        if (error) {
            alert('Error adding employee: ' + error.message)
        } else {
            setNewEmail('')
        }
        setIsAdding(false)
    }

    const handleApproveEmployee = async (userId: string) => {
        if (!user?.center_id) {
            alert('Your account is not linked to a center. Cannot approve employees.')
            return
        }
        setApprovingIds((prev) => new Set(prev).add(userId))
        const { error } = await approveEmployee(userId, user.center_id)
        if (error) {
            alert('Error approving employee: ' + error.message)
        }
        setApprovingIds((prev) => {
            const next = new Set(prev)
            next.delete(userId)
            return next
        })
    }

    const handleRemoveEmployee = async (userId: string) => {
        if (confirm('Are you sure you want to remove this employee?')) {
            const { error } = await removeEmployee(userId)
            if (error) {
                alert('Error removing employee: ' + error.message)
            }
        }
    }

    if (loading) return <LoadingSpinner />

    // Split users: fully active (have a center) vs pending (no center assigned)
    const activeEmployees = users.filter((u) => u.role === 'employee' && u.center_id !== null)
    const pendingEmployees = users.filter((u) => u.center_id === null && u.id !== user?.id)

    return (
        <div className="space-y-6">
            {/* ── Pending Approval Section ── */}
            {pendingEmployees.length > 0 && (
                <div className="card border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{S.pendingSectionHeading}</h2>
                            <p className="text-sm text-gray-600">{S.pendingSectionDesc}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {pendingEmployees.map((employee) => {
                            const isApproving = approvingIds.has(employee.id)
                            return (
                                <div
                                    key={employee.id}
                                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm">
                                                {employee.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{employee.email}</p>
                                            <p className="text-xs text-amber-600 font-medium">Awaiting center assignment</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleApproveEmployee(employee.id)}
                                        disabled={isApproving}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        {isApproving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {S.approvingButton}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                {S.approveButton}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Add Employee Form ── */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Employee Management</h2>
                        <p className="text-sm text-gray-500">Add and manage employee accounts</p>
                    </div>
                </div>

                <form onSubmit={handleAddEmployee} className="mb-6">
                    <label className="label">Add New Employee</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="input flex-1"
                            placeholder="employee@example.com"
                            required
                        />
                        <button type="submit" disabled={isAdding} className="btn-primary">
                            {isAdding ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Add Employee
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* ── Active Employee List ── */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">
                        {S.activeSectionHeading} ({activeEmployees.length})
                    </h3>

                    {activeEmployees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">{S.noActive}</div>
                    ) : (
                        <div className="space-y-2">
                            {activeEmployees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm">
                                                {employee.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{employee.email}</p>
                                            <p className="text-xs text-gray-500">
                                                Added on {new Date(employee.added_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveEmployee(employee.id)}
                                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
