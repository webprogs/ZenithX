import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDateTime, formatPercentage } from '@/utils/formatters';
import {
  getMember,
  getMemberTransactions,
  MemberShowResponse,
  MemberTransactions,
} from '@/api/admin/members';
import {
  updateUserProfile,
  adjustUserBalance,
  adjustInterestRate,
  updateUserStatus,
  toggleWithdrawalFreeze,
} from '@/api/admin/users';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ClockIcon,
  PencilIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

const MemberDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberShowResponse | null>(null);
  const [transactions, setTransactions] = useState<MemberTransactions | null>(null);
  const [activeTab, setActiveTab] = useState<'investments' | 'topups' | 'withdrawals'>('investments');

  // Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  const [showEditInterestModal, setShowEditInterestModal] = useState(false);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    reason: '',
    type: 'credit' as 'credit' | 'debit',
  });
  const [interestRate, setInterestRate] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'disabled'>('active');

  const fetchData = async () => {
    if (!id) return;
    try {
      const [memberRes, transactionsRes] = await Promise.all([
        getMember(Number(id)),
        getMemberTransactions(Number(id)),
      ]);
      setMemberData(memberRes.data);
      setTransactions(transactionsRes.data);

      // Initialize form states
      const member = memberRes.data.member;
      setProfileForm({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
      });
      setInterestRate(String(member.default_interest_rate ?? ''));
      setStatus(member.status as 'active' | 'inactive' | 'disabled');
    } catch (error) {
      console.error('Failed to fetch member:', error);
      toast.error('Failed to load member details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdateProfile = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateUserProfile(Number(id), {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone || null,
      });
      toast.success('Profile updated successfully');
      setShowEditProfileModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!id) return;
    const amount = parseFloat(balanceForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!balanceForm.reason.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    setIsSaving(true);
    try {
      const finalAmount = balanceForm.type === 'debit' ? -amount : amount;
      await adjustUserBalance(Number(id), {
        amount: finalAmount,
        reason: balanceForm.reason,
      });
      toast.success('Balance adjusted successfully');
      setShowAdjustBalanceModal(false);
      setBalanceForm({ amount: '', reason: '', type: 'credit' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to adjust balance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateInterestRate = async () => {
    if (!id) return;
    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Please enter a valid interest rate (0-100)');
      return;
    }

    setIsSaving(true);
    try {
      await adjustInterestRate(Number(id), { interest_rate: rate });
      toast.success('Interest rate updated successfully');
      setShowEditInterestModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update interest rate');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateUserStatus(Number(id), { status });
      toast.success('Status updated successfully');
      setShowEditStatusModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWithdrawalFreeze = async () => {
    if (!id) return;
    try {
      await toggleWithdrawalFreeze(Number(id));
      toast.success('Withdrawal freeze toggled');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle withdrawal freeze');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="text-center py-12">
        <p className="text-[#707a8a]">Member not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/members')}>
          Back to Members
        </Button>
      </div>
    );
  }

  const { member, stats } = memberData;

  const statCards = [
    {
      title: 'Total Invested',
      value: formatCurrency(stats.total_invested),
      icon: CurrencyDollarIcon,
      color: 'text-[#f0b90b]',
      bgColor: 'bg-[#fef6d8]',
    },
    {
      title: 'Interest Earned',
      value: formatCurrency(stats.total_interest_earned),
      icon: ArrowTrendingUpIcon,
      color: 'text-[#03a66d]',
      bgColor: 'bg-[#e6f7f0]',
    },
    {
      title: 'Available Balance',
      value: formatCurrency(stats.available_balance),
      icon: BanknotesIcon,
      color: 'text-[#0070f3]',
      bgColor: 'bg-[#e6f4ff]',
      editable: true,
    },
    {
      title: 'Total Withdrawn',
      value: formatCurrency(stats.total_withdrawn),
      icon: ClockIcon,
      color: 'text-[#c99400]',
      bgColor: 'bg-[#fef6d8]',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'disabled':
        return <Badge variant="danger">Disabled</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'paid':
        return <Badge variant="info">Paid</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/members')}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">{member.name}</h1>
          <p className="text-[#707a8a]">@{member.username}</p>
        </div>
      </div>

      {/* Member Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Member Information</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditProfileModal(true)}
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#707a8a]">Email</p>
              <p className="text-[#1e2329]">{member.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[#707a8a]">Phone</p>
              <p className="text-[#1e2329]">{member.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-[#707a8a]">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setShowEditStatusModal(true)}
                  className="hover:opacity-80 transition-opacity"
                >
                  {getStatusBadge(member.status)}
                </button>
                {member.withdrawal_frozen && (
                  <button
                    onClick={handleToggleWithdrawalFreeze}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Badge variant="danger">Withdrawal Frozen</Badge>
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-[#707a8a]">Interest Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-[#1e2329]">
                  {member.default_interest_rate !== null && member.default_interest_rate !== undefined
                    ? formatPercentage(member.default_interest_rate)
                    : 'Not set'}
                </p>
                <button
                  onClick={() => setShowEditInterestModal(true)}
                  className="text-[#707a8a] hover:text-[#1e2329]"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#707a8a]">Registered</p>
              <p className="text-[#1e2329]">{formatDateTime(member.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-[#707a8a]">Last Login</p>
              <p className="text-[#1e2329]">
                {member.last_login_at ? formatDateTime(member.last_login_at) : 'Never'}
              </p>
            </div>
            {member.invitation_link && (
              <div className="sm:col-span-2">
                <p className="text-sm text-[#707a8a]">Invitation Code</p>
                <p className="text-[#1e2329]">
                  <code className="px-2 py-1 bg-[#f5f5f5] rounded">{member.invitation_link.code}</code>
                  <span className="text-[#707a8a] ml-2">
                    ({formatPercentage(member.invitation_link.interest_rate)} rate)
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => setShowAdjustBalanceModal(true)}
            >
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              Adjust Balance
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={handleToggleWithdrawalFreeze}
            >
              {member.withdrawal_frozen ? 'Unfreeze Withdrawals' : 'Freeze Withdrawals'}
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => navigate(`/admin/topup-requests?user_id=${member.id}`)}
            >
              View Top-Up Requests
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => navigate(`/admin/withdrawal-requests?user_id=${member.id}`)}
            >
              View Withdrawals
            </Button>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-[#707a8a]">{stat.title}</p>
                  <p className="text-xl font-bold text-[#1e2329]">{stat.value}</p>
                </div>
              </div>
              {stat.editable && (
                <button
                  onClick={() => setShowAdjustBalanceModal(true)}
                  className="p-2 text-[#707a8a] hover:text-[#1e2329] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Transactions */}
      <Card padding="none">
        <div className="border-b border-[#eaecef]">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('investments')}
              className={`px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'investments'
                  ? 'text-[#1e2329] border-b-2 border-[#f0b90b]'
                  : 'text-[#707a8a] hover:text-[#1e2329]'
              }`}
            >
              Investments ({transactions?.investments?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('topups')}
              className={`px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'topups'
                  ? 'text-[#1e2329] border-b-2 border-[#f0b90b]'
                  : 'text-[#707a8a] hover:text-[#1e2329]'
              }`}
            >
              Top-Ups ({transactions?.topups?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'withdrawals'
                  ? 'text-[#1e2329] border-b-2 border-[#f0b90b]'
                  : 'text-[#707a8a] hover:text-[#1e2329]'
              }`}
            >
              Withdrawals ({transactions?.withdrawals?.length ?? 0})
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'investments' && (
            <div className="space-y-4">
              {!transactions?.investments?.length ? (
                <p className="text-[#707a8a] text-center py-8">No investments yet</p>
              ) : (
                transactions.investments.map((investment) => (
                  <div
                    key={investment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f5f5f5] rounded-lg gap-2 sm:gap-4"
                  >
                    <div>
                      <p className="text-[#1e2329] font-medium">{formatCurrency(investment.amount)}</p>
                      <p className="text-sm text-[#707a8a]">
                        {formatPercentage(investment.interest_rate)} rate
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[#03a66d]">
                        +{formatCurrency(investment.interest_earned)}
                      </p>
                      <p className="text-sm text-[#707a8a]">{formatDateTime(investment.start_date)}</p>
                    </div>
                    <div>{getStatusBadge(investment.status)}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'topups' && (
            <div className="space-y-4">
              {!transactions?.topups?.length ? (
                <p className="text-[#707a8a] text-center py-8">No top-up requests</p>
              ) : (
                transactions.topups.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f5f5f5] rounded-lg gap-2 sm:gap-4"
                  >
                    <div>
                      <p className="text-[#1e2329] font-medium">{formatCurrency(request.amount)}</p>
                      <p className="text-sm text-[#707a8a]">{request.payment_method || 'N/A'}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm text-[#707a8a]">{formatDateTime(request.created_at)}</p>
                    </div>
                    <div>{getStatusBadge(request.status)}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              {!transactions?.withdrawals?.length ? (
                <p className="text-[#707a8a] text-center py-8">No withdrawal requests</p>
              ) : (
                transactions.withdrawals.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f5f5f5] rounded-lg gap-2 sm:gap-4"
                  >
                    <div>
                      <p className="text-[#1e2329] font-medium">{formatCurrency(request.amount)}</p>
                      <p className="text-sm text-[#707a8a]">
                        {request.destination_type === 'crypto_trc20' ? 'Crypto TRC20' : request.bank_name}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm text-[#707a8a]">{formatDateTime(request.created_at)}</p>
                    </div>
                    <div>{getStatusBadge(request.status)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowEditProfileModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal
        isOpen={showAdjustBalanceModal}
        onClose={() => setShowAdjustBalanceModal(false)}
        title="Adjust Balance"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#707a8a] mb-2">Current Balance</p>
            <p className="text-2xl font-bold text-[#1e2329]">
              {formatCurrency(stats.available_balance)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e2329] mb-2">
              Adjustment Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setBalanceForm({ ...balanceForm, type: 'credit' })}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  balanceForm.type === 'credit'
                    ? 'border-[#03a66d] bg-[#e6f7f0] text-[#03a66d]'
                    : 'border-[#eaecef] text-[#707a8a] hover:border-[#03a66d]'
                }`}
              >
                <PlusIcon className="w-4 h-4" />
                Credit
              </button>
              <button
                onClick={() => setBalanceForm({ ...balanceForm, type: 'debit' })}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  balanceForm.type === 'debit'
                    ? 'border-[#cf304a] bg-[#fff0f0] text-[#cf304a]'
                    : 'border-[#eaecef] text-[#707a8a] hover:border-[#cf304a]'
                }`}
              >
                <MinusIcon className="w-4 h-4" />
                Debit
              </button>
            </div>
          </div>

          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={balanceForm.amount}
            onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
            placeholder="0.00"
          />
          <div>
            <label className="block text-sm font-medium text-[#1e2329] mb-1">
              Reason
            </label>
            <textarea
              value={balanceForm.reason}
              onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
              className="w-full px-4 py-2 border border-[#eaecef] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f0b90b] focus:border-transparent"
              rows={3}
              placeholder="Enter reason for adjustment..."
            />
          </div>

          {balanceForm.amount && (
            <div className="p-3 bg-[#f5f5f5] rounded-lg">
              <p className="text-sm text-[#707a8a]">New Balance</p>
              <p className={`text-lg font-bold ${balanceForm.type === 'credit' ? 'text-[#03a66d]' : 'text-[#cf304a]'}`}>
                {formatCurrency(
                  stats.available_balance +
                    (balanceForm.type === 'credit' ? 1 : -1) * parseFloat(balanceForm.amount || '0')
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowAdjustBalanceModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustBalance} isLoading={isSaving}>
              Adjust Balance
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Interest Rate Modal */}
      <Modal
        isOpen={showEditInterestModal}
        onClose={() => setShowEditInterestModal(false)}
        title="Edit Interest Rate"
      >
        <div className="space-y-4">
          <Input
            label="Interest Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="e.g. 5.00"
          />
          <p className="text-sm text-[#707a8a]">
            This will only affect new investments. Existing investments will keep their locked rate.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowEditInterestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInterestRate} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Status Modal */}
      <Modal
        isOpen={showEditStatusModal}
        onClose={() => setShowEditStatusModal(false)}
        title="Edit Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1e2329] mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'disabled')}
              className="w-full px-4 py-2 border border-[#eaecef] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f0b90b] focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <p className="text-sm text-[#707a8a]">
            Changing status to inactive or disabled will pause the user's interest accrual.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowEditStatusModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberDetails;
