import client from '@/api/client';
import { User, ApiResponse, PaginatedResponse } from '@/types';

export interface UsersParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: 'admin' | 'member';
  status?: 'active' | 'inactive' | 'disabled';
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface UserDetails extends User {
  total_invested: number;
  total_interest_earned: number;
  available_balance: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  invitation_link?: {
    code: string;
    interest_rate: number;
  };
  force_logout_at: string | null;
}

export interface UpdateStatusData {
  status: 'active' | 'inactive' | 'disabled';
  reason?: string;
}

export interface AdjustInterestRateData {
  interest_rate: number;
  reason?: string;
}

export const getUsers = async (
  params?: UsersParams
): Promise<PaginatedResponse<User>> => {
  const response = await client.get('/admin/users', { params });
  return response.data;
};

export const getUser = async (
  id: number
): Promise<ApiResponse<UserDetails>> => {
  const response = await client.get(`/admin/users/${id}`);
  return response.data;
};

export const updateUserStatus = async (
  id: number,
  data: UpdateStatusData
): Promise<ApiResponse<User>> => {
  const response = await client.patch(`/admin/users/${id}/status`, data);
  return response.data;
};

export const forceLogoutUser = async (
  id: number
): Promise<ApiResponse<null>> => {
  const response = await client.post(`/admin/users/${id}/force-logout`);
  return response.data;
};

export const resetUserPassword = async (
  id: number
): Promise<ApiResponse<{ temporary_password: string }>> => {
  const response = await client.post(`/admin/users/${id}/reset-password`);
  return response.data;
};

export const toggleWithdrawalFreeze = async (
  id: number,
  freeze: boolean,
  reason?: string
): Promise<ApiResponse<User>> => {
  const response = await client.patch(`/admin/users/${id}/withdrawal-freeze`, {
    freeze,
    reason,
  });
  return response.data;
};

export const adjustInterestRate = async (
  id: number,
  data: AdjustInterestRateData
): Promise<ApiResponse<User>> => {
  const response = await client.patch(`/admin/users/${id}/interest-rate`, data);
  return response.data;
};
