export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive' | 'disabled';
  phone: string | null;
  default_interest_rate: number | null;
  withdrawal_frozen: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface InvitationLink {
  id: number;
  code: string;
  interest_rate: number;
  assigned_role: 'admin' | 'member';
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  creator?: User;
  registrations?: User[];
  remaining_uses?: number | null;
  full_url?: string;
}

export interface Investment {
  id: number;
  user_id: number;
  topup_request_id: number | null;
  amount: number;
  interest_rate: number;
  interest_earned: number;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
  last_accrual_date: string | null;
  created_at: string;
  current_balance?: number;
}

export interface TopupRequest {
  id: number;
  user_id: number;
  amount: number;
  payment_method: string | null;
  proof_of_payment: string;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  processed_by: number | null;
  processed_at: string | null;
  rejection_reason: string | null;
  admin_remarks: string | null;
  created_at: string;
  user?: User;
  processor?: User;
  investment?: Investment;
  proof_of_payment_url?: string;
}

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount: number;
  destination_type: 'gcash' | 'bank';
  account_name: string;
  account_number: string;
  bank_name: string | null;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  processed_by: number | null;
  processed_at: string | null;
  payout_proof: string | null;
  rejection_reason: string | null;
  admin_remarks: string | null;
  created_at: string;
  user?: User;
  processor?: User;
  payout_proof_url?: string;
  destination_details?: string;
}

export interface Notification {
  id: string;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  auditable_type: string;
  auditable_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  description: string | null;
  created_at: string;
  user?: User;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  group: string;
  description: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface DashboardStats {
  total_invested: number;
  total_interest_paid: number;
  total_interest_pending: number;
  total_withdrawn: number;
  pending_topups: number;
  pending_withdrawals: number;
  approved_withdrawals: number;
  active_users: number;
  inactive_users: number;
  disabled_users: number;
  total_members: number;
}

export interface MemberDashboard {
  total_invested: number;
  total_interest_earned: number;
  available_balance: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  active_investments: number;
  pending_topups: number;
  pending_withdrawal_requests: number;
  interest_rate: number | null;
  projections: EarningsProjection[];
  unread_notifications: number;
}

export interface EarningsProjection {
  month: string;
  projected_interest: number;
  cumulative: number;
}

export interface ChartDataPoint {
  month: string;
  investments?: number;
  withdrawals?: number;
  value?: number;
}

export interface ActivityItem {
  type: 'topup' | 'withdrawal';
  action: string;
  user: string;
  amount: number;
  processor: string | null;
  date: string;
}
