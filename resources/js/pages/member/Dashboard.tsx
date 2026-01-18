import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import client from '@/api/client';
import { MemberDashboard } from '@/types';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await client.get('/member/dashboard');
        setDashboard(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Invested',
      value: formatCurrency(dashboard?.total_invested || 0),
      icon: CurrencyDollarIcon,
      color: 'text-[#f0b90b]',
      bgColor: 'bg-[#fef6d8]',
    },
    {
      title: 'Interest Earned',
      value: formatCurrency(dashboard?.total_interest_earned || 0),
      icon: ArrowTrendingUpIcon,
      color: 'text-[#03a66d]',
      bgColor: 'bg-[#e6f7f0]',
    },
    {
      title: 'Available Balance',
      value: formatCurrency(dashboard?.available_balance || 0),
      icon: BanknotesIcon,
      color: 'text-[#0070f3]',
      bgColor: 'bg-[#e6f4ff]',
    },
    {
      title: 'Total Withdrawn',
      value: formatCurrency(dashboard?.total_withdrawn || 0),
      icon: ClockIcon,
      color: 'text-[#c99400]',
      bgColor: 'bg-[#fef6d8]',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">Dashboard</h1>
          <p className="text-[#707a8a]">Track your investments and earnings</p>
        </div>
        <div className="flex items-center space-x-3 flex-wrap">
          <Button onClick={() => navigate('/member/topup/new')}>
            Add Funds
          </Button>
          <Button variant="secondary" onClick={() => navigate('/member/withdraw/new')}>
            Withdraw
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-[#707a8a]">{stat.title}</p>
                <p className="text-lg sm:text-xl font-bold text-[#1e2329]">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Interest Rate</CardTitle>
          </CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-2xl sm:text-4xl font-bold text-[#03a66d]">
                {formatPercentage(dashboard?.interest_rate || 0)}
              </p>
              <p className="text-[#707a8a] mt-1">Monthly interest rate</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[#707a8a]">Active Investments</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1e2329]">{dashboard?.active_investments || 0}</p>
            </div>
          </div>

          {dashboard?.projections && dashboard.projections.length > 0 && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#eaecef]">
              <h4 className="text-sm font-medium text-[#707a8a] mb-4">Projected Earnings</h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {dashboard.projections.slice(0, 3).map((projection) => (
                  <div key={projection.month} className="text-center">
                    <p className="text-xs sm:text-sm text-[#707a8a]">{projection.month}</p>
                    <p className="text-sm sm:text-lg font-semibold text-[#03a66d]">
                      +{formatCurrency(projection.projected_interest)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-[#f5f5f5] rounded-lg">
              <div>
                <p className="text-[#1e2329]">Top-Up Requests</p>
                <p className="text-sm text-[#707a8a]">Awaiting approval</p>
              </div>
              <Badge variant="warning">{dashboard?.pending_topups || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-[#f5f5f5] rounded-lg">
              <div>
                <p className="text-[#1e2329]">Withdrawal Requests</p>
                <p className="text-sm text-[#707a8a]">Being processed</p>
              </div>
              <Badge variant="info">{dashboard?.pending_withdrawal_requests || 0}</Badge>
            </div>
            {dashboard?.pending_withdrawals ? (
              <div className="flex items-center justify-between p-3 sm:p-4 bg-[#f5f5f5] rounded-lg">
                <div>
                  <p className="text-[#1e2329]">Pending Amount</p>
                  <p className="text-sm text-[#707a8a]">To be released</p>
                </div>
                <span className="text-[#c99400] font-medium">
                  {formatCurrency(dashboard.pending_withdrawals)}
                </span>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button
              variant="secondary"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/member/investments')}
            >
              <CurrencyDollarIcon className="w-6 h-6 mb-2" />
              View Investments
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/member/topup')}
            >
              <ArrowTrendingUpIcon className="w-6 h-6 mb-2" />
              Top-Up History
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/member/withdraw')}
            >
              <BanknotesIcon className="w-6 h-6 mb-2" />
              Withdrawals
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/member/profile')}
            >
              <ClockIcon className="w-6 h-6 mb-2" />
              Profile
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/member/notifications')}
            >
              View All
            </Button>
          </CardHeader>
          {dashboard?.unread_notifications ? (
            <div className="text-center py-4">
              <Badge variant="info" className="text-lg px-4 py-2">
                {dashboard.unread_notifications} unread
              </Badge>
              <p className="text-[#707a8a] mt-2">
                You have unread notifications
              </p>
            </div>
          ) : (
            <p className="text-[#707a8a] text-center py-4">
              No new notifications
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
