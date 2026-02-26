export interface Center {
    id: string;
    name: string;
    location: string;
    code: string;
    status: 'active' | 'inactive';
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    role: string;           // Dynamic — backed by the roles reference table
    center_id: string | null; // null = pending activation (no center assigned yet)
    added_at: string;
    added_by?: string;
    is_active: boolean;
}

export interface Token {
    id: string;
    token_id: string;
    customer_name: string;
    customer_phone: string;
    generated_by: string;
    generated_at: string;
    center_id?: string | null;
    status: 'active' | 'used' | 'cancelled';
    used_at?: string;
    notes?: string;
    daily_number?: number;
}

// Updated to match reworked form
export interface FormEntry {
    id: string;
    employee_id: string;
    token_used?: string;
    submitted_at: string;
    center_id?: string | null;
    customer_name: string;
    service_type: string;
    service_charge: number;
    bank_charge: number;
    payment_method: string;
    description?: string;
    status: string;
    priority?: string;
    contact_number?: string;
    estimated_cost?: number;
}

export interface AuthUser {
    id: string;
    email: string;
    role: string;           // Dynamic — use string comparison (e.g. role === 'center_manager')
    center_id: string | null; // null = limbo / pending activation
}
