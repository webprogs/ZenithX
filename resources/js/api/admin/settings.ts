import client from '@/api/client';
import { Setting, ApiResponse } from '@/types';

export interface SettingsGrouped {
  [group: string]: Setting[];
}

export interface UpdateSettingsData {
  [key: string]: string | number | boolean;
}

export const getSettings = async (): Promise<ApiResponse<SettingsGrouped>> => {
  const response = await client.get('/admin/settings');
  return response.data;
};

export const updateSettings = async (
  data: UpdateSettingsData
): Promise<ApiResponse<{ updated: string[] }>> => {
  // Transform flat key-value object to array format expected by backend
  const settings = Object.entries(data).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  const response = await client.put('/admin/settings', { settings });
  return response.data;
};
