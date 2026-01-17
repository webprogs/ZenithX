import client from '@/api/client';
import { User, ApiResponse } from '@/types';

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ProfileStats {
  total_invested: number;
  total_interest_earned: number;
  available_balance: number;
  total_withdrawn: number;
  member_since: string;
  interest_rate: number | null;
}

export const getProfile = async (): Promise<ApiResponse<User & ProfileStats>> => {
  const response = await client.get('/member/profile');
  return response.data;
};

export const updateProfile = async (
  data: UpdateProfileData
): Promise<ApiResponse<User>> => {
  const response = await client.put('/member/profile', data);
  return response.data;
};

export const changePassword = async (
  data: ChangePasswordData
): Promise<ApiResponse<null>> => {
  const response = await client.put('/member/profile/password', data);
  return response.data;
};
