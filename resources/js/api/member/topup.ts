import client from '@/api/client';
import { TopupRequest, ApiResponse, PaginatedResponse } from '@/types';

export interface TopupRequestsParams {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'rejected';
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface CreateTopupData {
  amount: number;
  payment_method?: string;
  proof_of_payment: File;
  notes?: string;
}

export interface TopupLimits {
  min_amount: number;
  max_amount: number;
  payment_methods: string[];
}

export const getTopupRequests = async (
  params?: TopupRequestsParams
): Promise<PaginatedResponse<TopupRequest>> => {
  const response = await client.get('/member/topup-requests', { params });
  return response.data;
};

export const getTopupRequest = async (
  id: number
): Promise<ApiResponse<TopupRequest>> => {
  const response = await client.get(`/member/topup-requests/${id}`);
  return response.data;
};

export const createTopupRequest = async (
  data: FormData
): Promise<ApiResponse<TopupRequest>> => {
  const response = await client.post('/member/topup-requests', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getTopupLimits = async (): Promise<ApiResponse<TopupLimits>> => {
  const response = await client.get('/member/topup-requests/limits');
  return response.data;
};
