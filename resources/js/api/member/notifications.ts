import client from '@/api/client';
import { Notification, ApiResponse, PaginatedResponse } from '@/types';

export interface NotificationsParams {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}

export interface NotificationCounts {
  total: number;
  unread: number;
}

export const getNotifications = async (
  params?: NotificationsParams
): Promise<PaginatedResponse<Notification>> => {
  const response = await client.get('/member/notifications', { params });
  return response.data;
};

export const getNotificationCounts = async (): Promise<ApiResponse<NotificationCounts>> => {
  const response = await client.get('/member/notifications/counts');
  return response.data;
};

export const markAsRead = async (
  id: string
): Promise<ApiResponse<Notification>> => {
  const response = await client.patch(`/member/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<ApiResponse<null>> => {
  const response = await client.post('/member/notifications/read-all');
  return response.data;
};
