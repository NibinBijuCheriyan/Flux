import { useState } from 'react'
import { Users, Plus, Trash2, Loader2 } from 'lucide-react'
import { useUsers } from '../../hooks/useUsers'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../shared/LoadingSpinner'

export function EmployeeManagement() {
    const { user } = useAuth()
    const { users, loading, addEmployee, removeEmployee } = useUsers()
    const [newEmail, setNewEmail] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !newEmail) return

        setIsAdding(true)
        const { error } = await addEmployee(newEmail, user.id)

        if (error) {
            alert('Error adding employee: ' + error.message)
        } else {
            setNewEmail('')
        }
        setIsAdding(false)
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

    const employees = users.filter((u) => u.role === 'employee')

    return (
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

            {/* Add Employee Form */}
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

            {/* Employee List */}
            <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                    Active Employees ({employees.length})
                </h3>

                {employees.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No employees added yet. Add your first employee above.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {employees.map((employee) => (
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
    )
}
