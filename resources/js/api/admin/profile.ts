import client from '@/api/client';
import { User } from '@/types';

export interface AdminProfile extends User {
  created_at: string;
  last_login_at: string | null;
}

export interface UpdateProfileData {
  name: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export const getProfile = async () => {
  const response = await client.get<{ data: AdminProfile }>('/admin/profile');
  return response.data;
};

export const updateProfile = async (data: UpdateProfileData) => {
  const response = await client.put<{ message: string; data: AdminProfile }>('/admin/profile', data);
  return response.data;
};

export const changePassword = async (data: ChangePasswordData) => {
  const response = await client.put<{ message: string }>('/admin/profile/password', data);
  return response.data;
};
