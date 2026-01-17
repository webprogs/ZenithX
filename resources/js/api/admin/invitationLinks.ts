import client from '@/api/client';
import { InvitationLink, ApiResponse, PaginatedResponse } from '@/types';

export interface CreateInvitationLinkData {
  interest_rate: number;
  assigned_role: 'admin' | 'member';
  max_uses?: number | null;
  expires_at?: string | null;
  notes?: string | null;
}

export interface UpdateInvitationLinkData {
  interest_rate?: number;
  max_uses?: number | null;
  expires_at?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface InvitationLinksParams {
  page?: number;
  per_page?: number;
  active?: boolean;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export const getInvitationLinks = async (
  params?: InvitationLinksParams
): Promise<PaginatedResponse<InvitationLink>> => {
  const response = await client.get('/admin/invitation-links', { params });
  return response.data;
};

export const getInvitationLink = async (
  id: number
): Promise<ApiResponse<InvitationLink>> => {
  const response = await client.get(`/admin/invitation-links/${id}`);
  return response.data;
};

export const createInvitationLink = async (
  data: CreateInvitationLinkData
): Promise<ApiResponse<InvitationLink>> => {
  const response = await client.post('/admin/invitation-links', data);
  return response.data;
};

export const updateInvitationLink = async (
  id: number,
  data: UpdateInvitationLinkData
): Promise<ApiResponse<InvitationLink>> => {
  const response = await client.put(`/admin/invitation-links/${id}`, data);
  return response.data;
};

export const deactivateInvitationLink = async (
  id: number
): Promise<ApiResponse<null>> => {
  const response = await client.delete(`/admin/invitation-links/${id}`);
  return response.data;
};
