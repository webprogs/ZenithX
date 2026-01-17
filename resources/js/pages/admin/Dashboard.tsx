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
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-900/20',
    },
    {
      title: 'Interest Paid',
      value: formatCurrency(stats?.total_interest_paid || 0),
      icon: ArrowTrendingUpIcon,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
    },
    {
      title: 'Pending Interest',
      value: formatCurrency(stats?.total_interest_pending || 0),
      icon: ClockIcon,
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/20',
    },
    {
      title: 'Active Members',
      value: stats?.active_users?.toString() || '0',
      icon: UsersIcon,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening.</p>
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
        <Card className="lg:col-span-2" padding="none">
          <CardHeader className="p-6 pb-0">
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <div className="p-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/topup-requests?status=pending')}
              className="p-4 bg-[#1a1a24] rounded-lg hover:bg-[#1e1e28] transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Top-Up Requests</span>
                <Badge variant="warning">{stats?.pending_topups || 0}</Badge>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.pending_topups || 0}</p>
              <p className="text-sm text-gray-400">awaiting approval</p>
            </button>

            <button
              onClick={() => navigate('/admin/withdrawal-requests?status=pending')}
              className="p-4 bg-[#1a1a24] rounded-lg hover:bg-[#1e1e28] transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Withdrawals</span>
                <Badge variant="warning">{stats?.pending_withdrawals || 0}</Badge>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.pending_withdrawals || 0}</p>
              <p className="text-sm text-gray-400">pending review</p>
            </button>

            <button
              onClick={() => navigate('/admin/withdrawal-requests?status=approved')}
              className="p-4 bg-[#1a1a24] rounded-lg hover:bg-[#1e1e28] transition-colors text-left col-span-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Ready for Payout</span>
                <Badge variant="info">{stats?.approved_withdrawals || 0}</Badge>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.approved_withdrawals || 0}</p>
              <p className="text-sm text-gray-400">approved, awaiting payout</p>
            </button>
          </div>
        </Card>

        <Card padding="none">
          <CardHeader className="p-6 pb-0">
            <CardTitle>User Status</CardTitle>
          </CardHeader>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active</span>
              <Badge variant="success">{stats?.active_users || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Inactive</span>
              <Badge variant="warning">{stats?.inactive_users || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Disabled</span>
              <Badge variant="danger">{stats?.disabled_users || 0}</Badge>
            </div>
            <div className="pt-4 border-t border-[#2d2d3a]">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Total Members</span>
                <span className="text-white font-bold">{stats?.total_members || 0}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader className="p-6 pb-0">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <div className="p-6">
          {activity.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activity.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-[#2d2d3a] last:border-0"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.type === 'topup' ? 'bg-emerald-900/30' : 'bg-red-900/30'
                    }`}>
                      {item.type === 'topup' ? (
                        <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <CurrencyDollarIcon className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white">
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
                      <p className="text-sm text-gray-400">{formatRelativeTime(item.date)}</p>
                    </div>
                  </div>
                  <p className="text-white font-medium">{formatCurrency(item.amount)}</p>
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
