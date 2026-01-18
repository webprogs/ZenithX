import client from '@/api/client';
import { Notification, ApiResponse, PaginatedResponse } from '@/types';

export interface NotificationsParams {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}

export const getNotifications = async (
  params?: NotificationsParams
): Promise<PaginatedResponse<Notification>> => {
  const response = await client.get('/admin/notifications', { params });
  return response.data;
};

export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  const response = await client.get('/admin/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (
  id: string
): Promise<ApiResponse<null>> => {
  const response = await client.put(`/admin/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<ApiResponse<null>> => {
  const response = await client.put('/admin/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (
  id: string
): Promise<ApiResponse<null>> => {
  const response = await client.delete(`/admin/notifications/${id}`);
  return response.data;
};

export const clearAllNotifications = async (): Promise<ApiResponse<null>> => {
  const response = await client.delete('/admin/notifications');
  return response.data;
};
