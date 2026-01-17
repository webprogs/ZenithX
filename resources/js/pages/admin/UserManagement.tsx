import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { User } from '@/types';
import { formatDateTime, formatPercentage } from '@/utils/formatters';
import {
  getUsers,
  getUser,
  updateUserStatus,
  forceLogoutUser,
  resetUserPassword,
  toggleWithdrawalFreeze,
  adjustInterestRate,
  UsersParams,
  UserDetails,
} from '@/api/admin/users';
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  NoSymbolIcon,
  CurrencyDollarIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

const statusSchema = z.object({
  status: z.enum(['active', 'inactive', 'disabled']),
  reason: z.string().optional(),
});

const interestRateSchema = z.object({
  interest_rate: z.coerce.number().min(0).max(100),
  reason: z.string().optional(),
});

type StatusFormData = z.infer<typeof statusSchema>;
type InterestRateFormData = z.infer<typeof interestRateSchema>;

const UserManagement = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'member' | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'disabled' | undefined>(undefined);

  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isInterestRateModalOpen, setIsInterestRateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const statusForm = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
  });

  const interestRateForm = useForm<InterestRateFormData>({
    resolver: zodResolver(interestRateSchema),
  });

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: UsersParams = {
        page,
        per_page: 15,
        sort: 'created_at',
        direction: 'desc',
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await getUsers(params);
      setUsers(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleViewUser = async (user: User) => {
    try {
      const response = await getUser(user.id);
      setSelectedUser(response.data);
      setIsViewModalOpen(true);
    } catch {
      toast.error('Failed to load user details');
    }
  };

  const handleOpenStatusModal = (user: UserDetails) => {
    setSelectedUser(user);
    statusForm.reset({ status: user.status });
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (data: StatusFormData) => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await updateUserStatus(selectedUser.id, data);
      toast.success('User status updated');
      setIsStatusModalOpen(false);
      fetchUsers(meta.current_page);
      // Refresh the selected user
      const response = await getUser(selectedUser.id);
      setSelectedUser(response.data);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForceLogout = async (user: UserDetails) => {
    if (!confirm(`Force logout ${user.name}? They will need to log in again.`)) return;
    setIsProcessing(true);
    try {
      await forceLogoutUser(user.id);
      toast.success('User has been logged out');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to force logout');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (user: UserDetails) => {
    if (!confirm(`Reset password for ${user.name}? A temporary password will be generated.`)) return;
    setIsProcessing(true);
    try {
      const response = await resetUserPassword(user.id);
      setTempPassword(response.data.temporary_password);
      toast.success('Password has been reset');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleWithdrawalFreeze = async (user: UserDetails) => {
    const freeze = !user.withdrawal_frozen;
    const action = freeze ? 'freeze' : 'unfreeze';
    if (!confirm(`${freeze ? 'Freeze' : 'Unfreeze'} withdrawals for ${user.name}?`)) return;
    setIsProcessing(true);
    try {
      await toggleWithdrawalFreeze(user.id, freeze);
      toast.success(`Withdrawals ${action}d successfully`);
      // Refresh the selected user
      const response = await getUser(user.id);
      setSelectedUser(response.data);
      fetchUsers(meta.current_page);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || `Failed to ${action} withdrawals`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenInterestRateModal = (user: UserDetails) => {
    setSelectedUser(user);
    interestRateForm.reset({ interest_rate: user.default_interest_rate || 0 });
    setIsInterestRateModalOpen(true);
  };

  const handleAdjustInterestRate = async (data: InterestRateFormData) => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await adjustInterestRate(selectedUser.id, data);
      toast.success('Interest rate updated');
      setIsInterestRateModalOpen(false);
      // Refresh the selected user
      const response = await getUser(selectedUser.id);
      setSelectedUser(response.data);
      fetchUsers(meta.current_page);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to update interest rate');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'disabled':
        return <Badge variant="danger">Disabled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="info">Admin</Badge>
    ) : (
      <Badge variant="default">Member</Badge>
    );
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400">Manage user accounts and permissions</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by name, username, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<MagnifyingGlassIcon className="w-5 h-5" />}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Role:</span>
              <div className="flex gap-2">
                <Button
                  variant={roleFilter === undefined ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setRoleFilter(undefined)}
                >
                  All
                </Button>
                <Button
                  variant={roleFilter === 'admin' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setRoleFilter('admin')}
                >
                  Admin
                </Button>
                <Button
                  variant={roleFilter === 'member' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setRoleFilter('member')}
                >
                  Member
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Status:</span>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === undefined ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter(undefined)}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                >
                  Inactive
                </Button>
                <Button
                  variant={statusFilter === 'disabled' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('disabled')}
                >
                  Disabled
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d3a]">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Interest Rate</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Login</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d3a]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1a1a24] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-sm text-gray-400">@{user.username}</div>
                        {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(user.status)}
                        {user.withdrawal_frozen && <Badge variant="danger">Frozen</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {user.default_interest_rate !== null
                        ? formatPercentage(user.default_interest_rate)
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          title="Manage User"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d2d3a]">
            <div className="text-sm text-gray-400">
              Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
              {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchUsers(meta.current_page - 1)}
                disabled={meta.current_page === 1}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-400">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchUsers(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View/Manage User Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
          setTempPassword(null);
        }}
        title="Manage User"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedUser.name}</h3>
                <p className="text-gray-400">@{selectedUser.username}</p>
                {selectedUser.email && (
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getRoleBadge(selectedUser.role)}
                {getStatusBadge(selectedUser.status)}
                {selectedUser.withdrawal_frozen && <Badge variant="danger">Frozen</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-[#1a1a24] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Interest Rate</p>
                <p className="text-white">
                  {selectedUser.default_interest_rate !== null
                    ? formatPercentage(selectedUser.default_interest_rate)
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Last Login</p>
                <p className="text-white">
                  {selectedUser.last_login_at
                    ? formatDateTime(selectedUser.last_login_at)
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Registered</p>
                <p className="text-white">{formatDateTime(selectedUser.created_at)}</p>
              </div>
              {selectedUser.invitation_link && (
                <div>
                  <p className="text-sm text-gray-400">Invitation Code</p>
                  <p className="text-white font-mono">{selectedUser.invitation_link.code}</p>
                </div>
              )}
            </div>

            {tempPassword && (
              <div className="p-4 bg-emerald-900/20 border border-emerald-700 rounded-lg">
                <p className="text-sm text-emerald-400 mb-2">Temporary Password</p>
                <code className="text-white text-lg font-mono">{tempPassword}</code>
                <p className="text-xs text-gray-400 mt-2">
                  Share this password with the user. They should change it after logging in.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => handleOpenStatusModal(selectedUser)}
                className="justify-start"
              >
                <ShieldExclamationIcon className="w-4 h-4 mr-2" />
                Change Status
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleOpenInterestRateModal(selectedUser)}
                className="justify-start"
              >
                <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                Adjust Interest Rate
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleToggleWithdrawalFreeze(selectedUser)}
                disabled={isProcessing}
                className="justify-start"
              >
                <NoSymbolIcon className="w-4 h-4 mr-2" />
                {selectedUser.withdrawal_frozen ? 'Unfreeze Withdrawals' : 'Freeze Withdrawals'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleForceLogout(selectedUser)}
                disabled={isProcessing}
                className="justify-start"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Force Logout
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleResetPassword(selectedUser)}
                disabled={isProcessing}
                className="justify-start col-span-2"
              >
                <KeyIcon className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
        }}
        title="Change User Status"
      >
        <form onSubmit={statusForm.handleSubmit(handleUpdateStatus)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select
              {...statusForm.register('status')}
              className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Reason (optional)
            </label>
            <textarea
              {...statusForm.register('reason')}
              rows={3}
              className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Reason for status change..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isProcessing}>
              Update Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Interest Rate Modal */}
      <Modal
        isOpen={isInterestRateModalOpen}
        onClose={() => {
          setIsInterestRateModalOpen(false);
        }}
        title="Adjust Interest Rate"
      >
        <form onSubmit={interestRateForm.handleSubmit(handleAdjustInterestRate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Interest Rate (%)
            </label>
            <Input
              type="number"
              step="0.01"
              {...interestRateForm.register('interest_rate')}
              error={interestRateForm.formState.errors.interest_rate?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Reason (optional)
            </label>
            <textarea
              {...interestRateForm.register('reason')}
              rows={3}
              className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Reason for interest rate change..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsInterestRateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isProcessing}>
              Update Rate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
