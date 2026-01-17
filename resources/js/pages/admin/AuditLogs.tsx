import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { AuditLog } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { getAuditLogs, getAuditLog, getAuditActions, AuditLogsParams } from '@/api/admin/auditLogs';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const AuditLogs = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [actions, setActions] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: AuditLogsParams = {
        page,
        per_page: 15,
        sort: 'created_at',
        direction: 'desc',
      };
      if (selectedAction) params.action = selectedAction;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await getAuditLogs(params);
      setLogs(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const response = await getAuditActions();
      setActions(response.data);
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  useEffect(() => {
    fetchActions();
    fetchLogs();
  }, []);

  const handleApplyFilters = () => {
    fetchLogs(1);
  };

  const handleClearFilters = () => {
    setSelectedAction(undefined);
    setDateFrom('');
    setDateTo('');
    fetchLogs(1);
  };

  const handleViewLog = async (log: AuditLog) => {
    try {
      const response = await getAuditLog(log.id);
      setSelectedLog(response.data);
      setIsViewModalOpen(true);
    } catch {
      toast.error('Failed to load log details');
    }
  };

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      create: 'success',
      update: 'info',
      delete: 'danger',
      approve: 'success',
      reject: 'danger',
      status_change: 'warning',
      force_logout: 'warning',
      password_reset: 'info',
      interest_rate_change: 'info',
      withdrawal_freeze: 'warning',
      withdrawal_unfreeze: 'success',
    };
    return <Badge variant={actionColors[action] || 'default'}>{action.replace(/_/g, ' ')}</Badge>;
  };

  const formatAuditableType = (type: string) => {
    return type.split('\\').pop() || type;
  };

  const renderJsonValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400">Track all administrative actions</p>
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon className="w-5 h-5 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
                <select
                  value={selectedAction || ''}
                  onChange={(e) => setSelectedAction(e.target.value || undefined)}
                  className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Logs Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d3a]">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Action</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Target</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Description</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d3a]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1a1a24] transition-colors">
                    <td className="px-6 py-4 text-gray-300">{formatDateTime(log.created_at)}</td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div>
                          <div className="text-white">{log.user.name}</div>
                          <div className="text-sm text-gray-400">@{log.user.username}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatAuditableType(log.auditable_type)} #{log.auditable_id}
                    </td>
                    <td className="px-6 py-4 text-white max-w-xs truncate">
                      {log.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLog(log)}
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d2d3a]">
            <div className="text-sm text-gray-400">
              Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
              {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} logs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchLogs(meta.current_page - 1)}
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
                onClick={() => fetchLogs(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Log Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedLog(null);
        }}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p className="text-white">{formatDateTime(selectedLog.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Action</p>
                <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Performed By</p>
                <p className="text-white">
                  {selectedLog.user
                    ? `${selectedLog.user.name} (@${selectedLog.user.username})`
                    : 'System'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Target</p>
                <p className="text-white">
                  {formatAuditableType(selectedLog.auditable_type)} #{selectedLog.auditable_id}
                </p>
              </div>
              {selectedLog.ip_address && (
                <div>
                  <p className="text-sm text-gray-400">IP Address</p>
                  <p className="text-white font-mono">{selectedLog.ip_address}</p>
                </div>
              )}
            </div>

            {selectedLog.description && (
              <div>
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-white mt-1">{selectedLog.description}</p>
              </div>
            )}

            {(selectedLog.old_values || selectedLog.new_values) && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300">Changes</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.old_values && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Before</p>
                      <pre className="p-3 bg-[#1a1a24] rounded-lg text-sm text-gray-300 overflow-auto max-h-48">
                        {renderJsonValue(selectedLog.old_values)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.new_values && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">After</p>
                      <pre className="p-3 bg-[#1a1a24] rounded-lg text-sm text-gray-300 overflow-auto max-h-48">
                        {renderJsonValue(selectedLog.new_values)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedLog(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
