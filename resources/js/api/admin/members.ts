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

export interface MemberStats {
  total_invested: number;
  total_interest_earned: number;
  available_balance: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  active_investments_count: number;
  pending_topups_count: number;
  pending_withdrawals_count: number;
}

export interface MemberWithInvitation extends User {
  invitation_link?: {
    id: number;
    code: string;
    interest_rate: number;
  };
}

export interface MemberShowResponse {
  member: MemberWithInvitation;
  stats: MemberStats;
}

export interface MemberTransactions {
  topups: TopupRequest[];
  withdrawals: WithdrawalRequest[];
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
): Promise<ApiResponse<MemberShowResponse>> => {
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
