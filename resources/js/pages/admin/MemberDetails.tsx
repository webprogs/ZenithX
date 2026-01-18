import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatDateTime, formatPercentage } from '@/utils/formatters';
import { getMember, getMemberTransactions, MemberDetails as MemberDetailsType, MemberTransactions } from '@/api/admin/members';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const MemberDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [member, setMember] = useState<MemberDetailsType | null>(null);
  const [transactions, setTransactions] = useState<MemberTransactions | null>(null);
  const [activeTab, setActiveTab] = useState<'investments' | 'topups' | 'withdrawals'>('investments');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [memberRes, transactionsRes] = await Promise.all([
          getMember(Number(id)),
          getMemberTransactions(Number(id)),
        ]);
        setMember(memberRes.data);
        setTransactions(transactionsRes.data);
      } catch (error) {
        console.error('Failed to fetch member:', error);
        toast.error('Failed to load member details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-[#707a8a]">Member not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/members')}>
          Back to Members
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Invested',
      value: formatCurrency(member.total_invested),
      icon: CurrencyDollarIcon,
      color: 'text-[#f0b90b]',
      bgColor: 'bg-[#fef6d8]',
    },
    {
      title: 'Interest Earned',
      value: formatCurrency(member.total_interest_earned),
      icon: ArrowTrendingUpIcon,
      color: 'text-[#03a66d]',
      bgColor: 'bg-[#e6f7f0]',
    },
    {
      title: 'Available Balance',
      value: formatCurrency(member.available_balance),
      icon: BanknotesIcon,
      color: 'text-[#0070f3]',
      bgColor: 'bg-[#e6f4ff]',
    },
    {
      title: 'Total Withdrawn',
      value: formatCurrency(member.total_withdrawn),
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
            <CardTitle>Member Information</CardTitle>
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
                {getStatusBadge(member.status)}
                {member.withdrawal_frozen && <Badge variant="danger">Withdrawal Frozen</Badge>}
              </div>
            </div>
            <div>
              <p className="text-sm text-[#707a8a]">Interest Rate</p>
              <p className="text-[#1e2329]">
                {member.default_interest_rate !== null
                  ? formatPercentage(member.default_interest_rate)
                  : 'Not set'}
              </p>
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
              onClick={() => navigate(`/admin/users?search=${member.username}`)}
            >
              Manage User Account
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[#707a8a]">{stat.title}</p>
                <p className="text-xl font-bold text-[#1e2329]">{stat.value}</p>
              </div>
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
              Investments ({transactions?.investments.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('topups')}
              className={`px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'topups'
                  ? 'text-[#1e2329] border-b-2 border-[#f0b90b]'
                  : 'text-[#707a8a] hover:text-[#1e2329]'
              }`}
            >
              Top-Ups ({transactions?.topup_requests.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'withdrawals'
                  ? 'text-[#1e2329] border-b-2 border-[#f0b90b]'
                  : 'text-[#707a8a] hover:text-[#1e2329]'
              }`}
            >
              Withdrawals ({transactions?.withdrawal_requests.length || 0})
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'investments' && (
            <div className="space-y-4">
              {transactions?.investments.length === 0 ? (
                <p className="text-[#707a8a] text-center py-8">No investments yet</p>
              ) : (
                transactions?.investments.map((investment) => (
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
              {transactions?.topup_requests.length === 0 ? (
                <p className="text-[#707a8a] text-center py-8">No top-up requests</p>
              ) : (
                transactions?.topup_requests.map((request) => (
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
              {transactions?.withdrawal_requests.length === 0 ? (
                <p className="text-[#707a8a] text-center py-8">No withdrawal requests</p>
              ) : (
                transactions?.withdrawal_requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f5f5f5] rounded-lg gap-2 sm:gap-4"
                  >
                    <div>
                      <p className="text-[#1e2329] font-medium">{formatCurrency(request.amount)}</p>
                      <p className="text-sm text-[#707a8a]">
                        {request.destination_type === 'gcash' ? 'GCash' : request.bank_name}
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
    </div>
  );
};

export default MemberDetails;
