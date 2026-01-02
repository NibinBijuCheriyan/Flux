export interface User {
    id: string;
    email: string;
    role: 'manager' | 'employee';
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
    status: 'active' | 'used' | 'cancelled';
    used_at?: string;
    notes?: string;
}

// Updated to match reworked form
export interface FormEntry {
    id: string;
    employee_id: string;
    token_used?: string;
    submitted_at: string;
    customer_name: string;
    service_type: string;
    service_charge: number;   // New
    bank_charge: number;      // New
    payment_method: string;   // New
    description?: string;     // Optional/Unused
    status: string;
    priority?: string;        // Made optional
    contact_number?: string;  // Made optional
    estimated_cost?: number;  // Made optional
}

export interface AuthUser {
    id: string;
    email: string;
    role: 'manager' | 'employee';
}
