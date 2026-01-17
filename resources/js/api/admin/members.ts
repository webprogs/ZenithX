import client from '@/api/client';
import { User, ApiResponse, PaginatedResponse, TopupRequest, WithdrawalRequest, Investment } from '@/types';

export interface MembersParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'disabled';
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface MemberDetails extends User {
  total_invested: number;
  total_interest_earned: number;
  available_balance: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  invitation_link?: {
    code: string;
    interest_rate: number;
  };
}

export interface MemberTransactions {
  topup_requests: TopupRequest[];
  withdrawal_requests: WithdrawalRequest[];
  investments: Investment[];
}

export const getMembers = async (
  params?: MembersParams
): Promise<PaginatedResponse<User>> => {
  const response = await client.get('/admin/members', { params });
  return response.data;
};

export const getMember = async (
  id: number
): Promise<ApiResponse<MemberDetails>> => {
  const response = await client.get(`/admin/members/${id}`);
  return response.data;
};

export const getMemberTransactions = async (
  id: number
): Promise<ApiResponse<MemberTransactions>> => {
  const response = await client.get(`/admin/members/${id}/transactions`);
  return response.data;
};

export const exportMembers = async (
  params?: MembersParams
): Promise<Blob> => {
  const response = await client.get('/admin/members/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};
