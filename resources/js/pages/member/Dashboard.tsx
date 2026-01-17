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
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-900/20',
    },
    {
      title: 'Interest Earned',
      value: formatCurrency(dashboard?.total_interest_earned || 0),
      icon: ArrowTrendingUpIcon,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
    },
    {
      title: 'Available Balance',
      value: formatCurrency(dashboard?.available_balance || 0),
      icon: BanknotesIcon,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-900/20',
    },
    {
      title: 'Total Withdrawn',
      value: formatCurrency(dashboard?.total_withdrawn || 0),
      icon: ClockIcon,
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Track your investments and earnings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => navigate('/member/topup/new')}>
            Add Funds
          </Button>
          <Button variant="secondary" onClick={() => navigate('/member/withdraw/new')}>
            Withdraw
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">{stat.title}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Interest Rate</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-emerald-400">
                {formatPercentage(dashboard?.interest_rate || 0)}
              </p>
              <p className="text-gray-400 mt-1">Monthly interest rate</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">Active Investments</p>
              <p className="text-2xl font-bold text-white">{dashboard?.active_investments || 0}</p>
            </div>
          </div>

          {dashboard?.projections && dashboard.projections.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#2d2d3a]">
              <h4 className="text-sm font-medium text-gray-400 mb-4">Projected Earnings</h4>
              <div className="grid grid-cols-3 gap-4">
                {dashboard.projections.slice(0, 3).map((projection) => (
                  <div key={projection.month} className="text-center">
                    <p className="text-sm text-gray-400">{projection.month}</p>
                    <p className="text-lg font-semibold text-emerald-400">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#1a1a24] rounded-lg">
              <div>
                <p className="text-white">Top-Up Requests</p>
                <p className="text-sm text-gray-400">Awaiting approval</p>
              </div>
              <Badge variant="warning">{dashboard?.pending_topups || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#1a1a24] rounded-lg">
              <div>
                <p className="text-white">Withdrawal Requests</p>
                <p className="text-sm text-gray-400">Being processed</p>
              </div>
              <Badge variant="info">{dashboard?.pending_withdrawal_requests || 0}</Badge>
            </div>
            {dashboard?.pending_withdrawals ? (
              <div className="flex items-center justify-between p-4 bg-[#1a1a24] rounded-lg">
                <div>
                  <p className="text-white">Pending Amount</p>
                  <p className="text-sm text-gray-400">To be released</p>
                </div>
                <span className="text-amber-400 font-medium">
                  {formatCurrency(dashboard.pending_withdrawals)}
                </span>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
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
              <p className="text-gray-400 mt-2">
                You have unread notifications
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No new notifications
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
