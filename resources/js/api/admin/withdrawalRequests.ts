import client from '@/api/client';
import { WithdrawalRequest, ApiResponse, PaginatedResponse } from '@/types';

export interface WithdrawalRequestsParams {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'paid' | 'rejected';
  user_id?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface ApproveWithdrawalData {
  admin_remarks?: string;
}

export interface RejectWithdrawalData {
  rejection_reason: string;
  admin_remarks?: string;
}

export interface MarkPaidData {
  payout_proof?: File;
  admin_remarks?: string;
}

export const getWithdrawalRequests = async (
  params?: WithdrawalRequestsParams
): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const response = await client.get('/admin/withdrawal-requests', { params });
  return response.data;
};

export const getWithdrawalRequest = async (
  id: number
): Promise<ApiResponse<WithdrawalRequest>> => {
  const response = await client.get(`/admin/withdrawal-requests/${id}`);
  return response.data;
};

export const approveWithdrawalRequest = async (
  id: number,
  data?: ApproveWithdrawalData
): Promise<ApiResponse<WithdrawalRequest>> => {
  const response = await client.post(`/admin/withdrawal-requests/${id}/approve`, data);
  return response.data;
};

export const rejectWithdrawalRequest = async (
  id: number,
  data: RejectWithdrawalData
): Promise<ApiResponse<WithdrawalRequest>> => {
  const response = await client.post(`/admin/withdrawal-requests/${id}/reject`, data);
  return response.data;
};

export const markWithdrawalPaid = async (
  id: number,
  data?: FormData
): Promise<ApiResponse<WithdrawalRequest>> => {
  const response = await client.post(`/admin/withdrawal-requests/${id}/paid`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
