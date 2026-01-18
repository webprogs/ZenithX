import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';
import client from '@/api/client';
import { DashboardStats, ChartDataPoint, ActivityItem } from '@/types';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ClockIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<ChartDataPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await client.get('/admin/dashboard');
        setStats(response.data.data.stats);
        setChart(response.data.data.chart);
        setActivity(response.data.data.recent_activity);
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
      value: formatCurrency(stats?.total_invested || 0),
      icon: CurrencyDollarIcon,
      color: 'text-[#f0b90b]',
      bgColor: 'bg-[#fef6d8]',
    },
    {
      title: 'Interest Paid',
      value: formatCurrency(stats?.total_interest_paid || 0),
      icon: ArrowTrendingUpIcon,
      color: 'text-[#03a66d]',
      bgColor: 'bg-[#e6f7f0]',
    },
    {
      title: 'Total Withdrawn',
      value: formatCurrency(stats?.total_withdrawn || 0),
      icon: BanknotesIcon,
      color: 'text-[#cf304a]',
      bgColor: 'bg-[#fce8eb]',
    },
    {
      title: 'Pending Interest',
      value: formatCurrency(stats?.total_interest_pending || 0),
      icon: ClockIcon,
      color: 'text-[#c99400]',
      bgColor: 'bg-[#fef6d8]',
    },
    {
      title: 'Active Members',
      value: stats?.active_users?.toString() || '0',
      icon: UsersIcon,
      color: 'text-[#0070f3]',
      bgColor: 'bg-[#e6f4ff]',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">Dashboard</h1>
        <p className="text-[#707a8a]">Welcome back! Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2" padding="none">
          <CardHeader className="p-4 sm:p-6 pb-0">
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/topup-requests?status=pending')}
              className="p-4 bg-[#f5f5f5] rounded-lg hover:bg-[#f0f0f0] transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#707a8a]">Top-Up Requests</span>
                <Badge variant="warning">{stats?.pending_topups || 0}</Badge>
              </div>
              <p className="text-2xl font-bold text-[#1e2329]">{stats?.pending_topups || 0}</p>
              <p className="text-sm text-[#707a8a]">awaiting approval</p>
            </button>

            <button
              onClick={() => navigate('/admin/withdrawal-requests?status=pending')}
              className="p-4 bg-[#f5f5f5] rounded-lg hover:bg-[#f0f0f0] transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#707a8a]">Withdrawals</span>
                <Badge variant="warning">{stats?.pending_withdrawals || 0}</Badge>
              </div>
              <p className="text-2xl font-bold text-[#1e2329]">{stats?.pending_withdrawals || 0}</p>
              <p className="text-sm text-[#707a8a]">pending review</p>
            </button>

            <button
              onClick={() => navigate('/admin/withdrawal-requests?status=approved')}
              className="p-4 bg-[#f5f5f5] rounded-lg hover:bg-[#f0f0f0] transition-colors text-left sm:col-span-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#707a8a]">Ready for Payout</span>
                <Badge variant="info">{stats?.approved_withdrawals || 0}</Badge>
              </div>
              <p className="text-2xl font-bold text-[#1e2329]">{stats?.approved_withdrawals || 0}</p>
              <p className="text-sm text-[#707a8a]">approved, awaiting payout</p>
            </button>
          </div>
        </Card>

        <Card padding="none">
          <CardHeader className="p-4 sm:p-6 pb-0">
            <CardTitle>User Status</CardTitle>
          </CardHeader>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#707a8a]">Active</span>
              <Badge variant="success">{stats?.active_users || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#707a8a]">Inactive</span>
              <Badge variant="warning">{stats?.inactive_users || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#707a8a]">Disabled</span>
              <Badge variant="danger">{stats?.disabled_users || 0}</Badge>
            </div>
            <div className="pt-4 border-t border-[#eaecef]">
              <div className="flex items-center justify-between">
                <span className="text-[#1e2329] font-medium">Total Members</span>
                <span className="text-[#1e2329] font-bold">{stats?.total_members || 0}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <div className="p-4 sm:p-6">
          {activity.length === 0 ? (
            <p className="text-[#707a8a] text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activity.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-[#eaecef] last:border-0 gap-2"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.type === 'topup' ? 'bg-[#e6f7f0]' : 'bg-[#fce8eb]'
                    }`}>
                      {item.type === 'topup' ? (
                        <ArrowTrendingUpIcon className="w-5 h-5 text-[#03a66d]" />
                      ) : (
                        <CurrencyDollarIcon className="w-5 h-5 text-[#cf304a]" />
                      )}
                    </div>
                    <div>
                      <p className="text-[#1e2329]">
                        {item.user} - {item.type === 'topup' ? 'Top-up' : 'Withdrawal'}{' '}
                        <Badge
                          variant={
                            item.action === 'approved' || item.action === 'paid'
                              ? 'success'
                              : item.action === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {item.action}
                        </Badge>
                      </p>
                      <p className="text-sm text-[#707a8a]">{formatRelativeTime(item.date)}</p>
                    </div>
                  </div>
                  <p className="text-[#1e2329] font-medium sm:text-right">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
