import client from '@/api/client';
import { WithdrawalRequest, ApiResponse, PaginatedResponse } from '@/types';

export interface WithdrawalRequestsParams {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'paid' | 'rejected';
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface CreateWithdrawalData {
  amount: number;
  destination_type: 'gcash' | 'bank';
  account_name: string;
  account_number: string;
  bank_name?: string;
}

export interface WithdrawalLimits {
  min_amount: number;
  max_amount: number;
  available_balance: number;
  withdrawal_frozen: boolean;
}

export const getWithdrawalRequests = async (
  params?: WithdrawalRequestsParams
): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const response = await client.get('/member/withdrawal-requests', { params });
  return response.data;
};

export const getWithdrawalRequest = async (
  id: number
): Promise<ApiResponse<WithdrawalRequest>> => {
  const response = await client.get(`/member/withdrawal-requests/${id}`);
  return response.data;
};

export const createWithdrawalRequest = async (
  data: CreateWithdrawalData
): Promise<ApiResponse<WithdrawalRequest>> => {
  const response = await client.post('/member/withdrawal-requests', data);
  return response.data;
};

export const getWithdrawalLimits = async (): Promise<ApiResponse<WithdrawalLimits>> => {
  const response = await client.get('/member/withdrawal-requests/limits');
  return response.data;
};
