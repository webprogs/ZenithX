import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { User } from '@/types';
import { formatCurrency, formatDateTime, formatPercentage } from '@/utils/formatters';
import { getMembers, exportMembers, MembersParams } from '@/api/admin/members';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const Members = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'disabled' | undefined>(
    (searchParams.get('status') as 'active' | 'inactive' | 'disabled') || undefined
  );
  const [isExporting, setIsExporting] = useState(false);

  const fetchMembers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: MembersParams = {
        page,
        per_page: 15,
        sort: 'created_at',
        direction: 'desc',
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await getMembers(params);
      setMembers(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params: MembersParams = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const blob = await exportMembers(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export downloaded successfully');
    } catch {
      toast.error('Failed to export members');
    } finally {
      setIsExporting(false);
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

  if (isLoading && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">Members</h1>
          <p className="text-[#707a8a]">View and manage platform members</p>
        </div>
        <Button onClick={handleExport} isLoading={isExporting} variant="secondary">
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
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
          <div className="flex flex-wrap gap-2">
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
      </Card>

      {/* Members Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eaecef]">
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Member</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a] hidden sm:table-cell">Interest Rate</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Status</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a] hidden md:table-cell">Last Login</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a] hidden lg:table-cell">Registered</th>
                <th className="text-right px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d3a]">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#707a8a]">
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-[#f5f5f5] transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <div className="text-[#1e2329] font-medium">{member.name}</div>
                        <div className="text-sm text-[#707a8a]">@{member.username}</div>
                        {member.email && (
                          <div className="text-xs text-[#b7b9bc]">{member.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-[#1e2329] hidden sm:table-cell">
                      {member.default_interest_rate !== null
                        ? formatPercentage(member.default_interest_rate)
                        : '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        {getStatusBadge(member.status)}
                        {member.withdrawal_frozen && (
                          <Badge variant="danger">Frozen</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-[#474d57] hidden md:table-cell">
                      {member.last_login_at ? formatDateTime(member.last_login_at) : 'Never'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-[#474d57] hidden lg:table-cell">
                      {formatDateTime(member.created_at)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/members/${member.id}`)}
                          title="View Details"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-[#eaecef]">
            <div className="text-sm text-[#707a8a]">
              <span className="hidden sm:inline">Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
              {Math.min(meta.current_page * meta.per_page, meta.total)} of </span>{meta.total} members
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchMembers(meta.current_page - 1)}
                disabled={meta.current_page === 1}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[#707a8a]">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchMembers(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Members;
