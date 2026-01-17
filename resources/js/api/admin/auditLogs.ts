import client from '@/api/client';
import { AuditLog, ApiResponse, PaginatedResponse } from '@/types';

export interface AuditLogsParams {
  page?: number;
  per_page?: number;
  user_id?: number;
  action?: string;
  auditable_type?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export const getAuditLogs = async (
  params?: AuditLogsParams
): Promise<PaginatedResponse<AuditLog>> => {
  const response = await client.get('/admin/audit-logs', { params });
  return response.data;
};

export const getAuditLog = async (
  id: number
): Promise<ApiResponse<AuditLog>> => {
  const response = await client.get(`/admin/audit-logs/${id}`);
  return response.data;
};

export const getAuditActions = async (): Promise<ApiResponse<string[]>> => {
  const response = await client.get('/admin/audit-logs/actions');
  return response.data;
};
