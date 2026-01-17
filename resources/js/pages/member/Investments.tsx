import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Investment } from '@/types';
import { formatCurrency, formatDateTime, formatPercentage, formatDate } from '@/utils/formatters';
import { getInvestments, InvestmentsParams } from '@/api/member/investments';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const Investments = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | 'completed' | undefined>(undefined);

  // Calculate summary from investments with safety check
  const summary = useMemo(() => {
    const investmentsList = Array.isArray(investments) ? investments : [];
    return {
      total_invested: investmentsList.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      total_interest_earned: investmentsList.reduce((sum, inv) => sum + (inv.interest_earned || 0), 0),
      active_investments: investmentsList.filter((inv) => inv.status === 'active').length,
    };
  }, [investments]);

  const fetchInvestments = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: InvestmentsParams = {
        page,
        per_page: 15,
        sort: 'created_at',
        direction: 'desc',
      };
      if (statusFilter) params.status = statusFilter;

      const response = await getInvestments(params);
      setInvestments(Array.isArray(response.data) ? response.data : []);
      setMeta(response.meta || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
    } catch (error) {
      console.error('Failed to fetch investments:', error);
      toast.error('Failed to load investments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const investmentsList = Array.isArray(investments) ? investments : [];

  if (isLoading && investmentsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Investments</h1>
        <p className="text-gray-400">Track your investment portfolio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-indigo-900/20">
              <CurrencyDollarIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Invested</p>
              <p className="text-xl font-bold text-white">{formatCurrency(summary.total_invested)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-emerald-900/20">
              <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Interest Earned</p>
              <p className="text-xl font-bold text-emerald-400">
                +{formatCurrency(summary.total_interest_earned)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-cyan-900/20">
              <ChartBarIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Active Investments</p>
              <p className="text-xl font-bold text-white">{summary.active_investments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Filter by status:</span>
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
              variant={statusFilter === 'paused' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('paused')}
            >
              Paused
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>
      </Card>

      {/* Investments List */}
      <div className="space-y-4">
        {investmentsList.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-400">
              No investments found. Start by making a top-up request.
            </div>
          </Card>
        ) : (
          investmentsList.map((investment) => (
            <Card key={investment.id}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {formatCurrency(investment.amount)}
                    </h3>
                    {getStatusBadge(investment.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Interest Rate</p>
                      <p className="text-white">{formatPercentage(investment.interest_rate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Interest Earned</p>
                      <p className="text-emerald-400">+{formatCurrency(investment.interest_earned)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Start Date</p>
                      <p className="text-white">{formatDate(investment.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last Accrual</p>
                      <p className="text-white">
                        {investment.last_accrual_date
                          ? formatDate(investment.last_accrual_date)
                          : 'Not yet'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Current Balance</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(parseFloat(investment.amount) + parseFloat(investment.interest_earned))}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
            {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} investments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchInvestments(meta.current_page - 1)}
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
              onClick={() => fetchInvestments(meta.current_page + 1)}
              disabled={meta.current_page === meta.last_page}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
