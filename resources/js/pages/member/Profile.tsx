import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { User } from '@/types';
import { formatCurrency, formatDateTime, formatPercentage } from '@/utils/formatters';
import { getProfile, updateProfile, changePassword, ProfileStats } from '@/api/member/profile';
import { useAuthStore } from '@/stores/authStore';
import {
  UserCircleIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile = () => {
  const { refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profile, setProfile] = useState<(User & ProfileStats) | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setProfile(response.data);
        profileForm.reset({
          name: response.data.name,
          email: response.data.email || '',
          phone: response.data.phone || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
      toast.success('Profile updated successfully');
      refreshUser();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    setIsSavingPassword(true);
    try {
      await changePassword(data);
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-[#707a8a]">Failed to load profile</div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">My Profile</h1>
        <p className="text-[#707a8a]">Manage your account information</p>
      </div>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#fef6d8] flex items-center justify-center flex-shrink-0">
            <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#f0b90b]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-[#1e2329]">{profile.name}</h2>
            <p className="text-[#707a8a]">@{profile.username}</p>
            <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
              <Badge variant={profile.status === 'active' ? 'success' : 'warning'}>
                {profile.status}
              </Badge>
              {profile.withdrawal_frozen && <Badge variant="danger">Withdrawals Frozen</Badge>}
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-[#707a8a]">Interest Rate</p>
            <p className="text-xl sm:text-2xl font-bold text-[#03a66d]">
              {profile.interest_rate !== null ? formatPercentage(profile.interest_rate) : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-lg bg-[#fef6d8]">
              <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#f0b90b]" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-[#707a8a]">Total Invested</p>
              <p className="text-base sm:text-lg font-bold text-[#1e2329]">
                {formatCurrency(profile.total_invested)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-lg bg-[#e6f7f0]">
              <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#03a66d]" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-[#707a8a]">Interest Earned</p>
              <p className="text-base sm:text-lg font-bold text-[#03a66d]">
                +{formatCurrency(profile.total_interest_earned)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-lg bg-[#e6f4ff]">
              <BanknotesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0070f3]" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-[#707a8a]">Available Balance</p>
              <p className="text-base sm:text-lg font-bold text-[#1e2329]">
                {formatCurrency(profile.available_balance)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-lg bg-[#fef6d8]">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#c99400]" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm text-[#707a8a]">Member Since</p>
              <p className="text-base sm:text-lg font-bold text-[#1e2329]">
                {formatDateTime(profile.member_since).split(',')[0]}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Update Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
          </CardHeader>
          <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">Username</label>
              <Input value={profile.username} disabled />
              <p className="mt-1 text-xs text-[#b7b9bc]">Username cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...profileForm.register('name')}
                error={profileForm.formState.errors.name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">Email</label>
              <Input
                type="email"
                {...profileForm.register('email')}
                error={profileForm.formState.errors.email?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">Phone</label>
              <Input
                {...profileForm.register('phone')}
                placeholder="e.g., 09171234567"
                error={profileForm.formState.errors.phone?.message}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={isSavingProfile}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LockClosedIcon className="w-5 h-5 text-[#707a8a]" />
              <CardTitle>Change Password</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                {...passwordForm.register('current_password')}
                error={passwordForm.formState.errors.current_password?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                {...passwordForm.register('password')}
                error={passwordForm.formState.errors.password?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                {...passwordForm.register('password_confirmation')}
                error={passwordForm.formState.errors.password_confirmation?.message}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={isSavingPassword}>
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
