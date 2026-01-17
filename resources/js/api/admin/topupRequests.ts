import client from '@/api/client';
import { TopupRequest, ApiResponse, PaginatedResponse } from '@/types';

export interface TopupRequestsParams {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'rejected';
  user_id?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface ApproveTopupData {
  admin_remarks?: string;
}

export interface RejectTopupData {
  rejection_reason: string;
  admin_remarks?: string;
}

export const getTopupRequests = async (
  params?: TopupRequestsParams
): Promise<PaginatedResponse<TopupRequest>> => {
  const response = await client.get('/admin/topup-requests', { params });
  return response.data;
};

export const getTopupRequest = async (
  id: number
): Promise<ApiResponse<TopupRequest>> => {
  const response = await client.get(`/admin/topup-requests/${id}`);
  return response.data;
};

export const approveTopupRequest = async (
  id: number,
  data?: ApproveTopupData
): Promise<ApiResponse<TopupRequest>> => {
  const response = await client.post(`/admin/topup-requests/${id}/approve`, data);
  return response.data;
};

export const rejectTopupRequest = async (
  id: number,
  data: RejectTopupData
): Promise<ApiResponse<TopupRequest>> => {
  const response = await client.post(`/admin/topup-requests/${id}/reject`, data);
  return response.data;
};
