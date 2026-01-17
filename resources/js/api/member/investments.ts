import client from '@/api/client';
import { Investment, ApiResponse, PaginatedResponse } from '@/types';

export interface InvestmentsParams {
  page?: number;
  per_page?: number;
  status?: 'active' | 'paused' | 'completed';
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface InvestmentSummary {
  total_invested: number;
  total_interest_earned: number;
  active_investments: number;
  average_interest_rate: number;
}

export const getInvestments = async (
  params?: InvestmentsParams
): Promise<PaginatedResponse<Investment>> => {
  const response = await client.get('/member/investments', { params });
  return response.data;
};

export const getInvestment = async (
  id: number
): Promise<ApiResponse<Investment>> => {
  const response = await client.get(`/member/investments/${id}`);
  return response.data;
};

export const getInvestmentSummary = async (): Promise<ApiResponse<InvestmentSummary>> => {
  const response = await client.get('/member/investments/summary');
  return response.data;
};
