import client from './client';
import { ApiResponse, User, InvitationLink } from '@/types';

interface LoginCredentials {
  login: string;
  password: string;
}

interface RegisterData {
  invitation_code: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
  const response = await client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
  return response.data;
};

export const register = async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
  const response = await client.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return response.data;
};

export const logout = async (): Promise<ApiResponse<null>> => {
  const response = await client.post<ApiResponse<null>>('/auth/logout');
  return response.data;
};

export const getCurrentUser = async (): Promise<ApiResponse<{ user: User; unread_notifications: number }>> => {
  const response = await client.get<ApiResponse<{ user: User; unread_notifications: number }>>('/auth/user');
  return response.data;
};

export const validateInvitation = async (code: string): Promise<ApiResponse<Partial<InvitationLink>>> => {
  const response = await client.get<ApiResponse<Partial<InvitationLink>>>(`/invitation/${code}`);
  return response.data;
};
