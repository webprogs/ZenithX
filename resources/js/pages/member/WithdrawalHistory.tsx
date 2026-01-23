import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { WithdrawalRequest } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { getWithdrawalRequests, getWithdrawalRequest, WithdrawalRequestsParams } from '@/api/member/withdrawal';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const WithdrawalHistory = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'approved' | 'paid' | 'rejected' | undefined
  >(undefined);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchRequests = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: WithdrawalRequestsParams = {
        page,
        per_page: 15,
        sort: 'created_at',
        direction: 'desc',
      };
      if (statusFilter) params.status = statusFilter;

      const response = await getWithdrawalRequests(params);
      setRequests(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleView = async (request: WithdrawalRequest) => {
    try {
      const response = await getWithdrawalRequest(request.id);
      setSelectedRequest(response.data);
      setIsViewModalOpen(true);
    } catch {
      toast.error('Failed to load request details');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="info">Approved</Badge>;
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading && requests.length === 0) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">Withdrawal History</h1>
          <p className="text-[#707a8a]">View your withdrawal request history</p>
        </div>
        <Button onClick={() => navigate('/member/withdraw/new')}>
          <PlusIcon className="w-5 h-5 mr-2" />
          New Withdrawal
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-[#707a8a]">Filter by status:</span>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === undefined ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter(undefined)}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('approved')}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === 'paid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('paid')}
            >
              Paid
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('rejected')}
            >
              Rejected
            </Button>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eaecef]">
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Date</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Amount</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a] hidden sm:table-cell">Destination</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Status</th>
                <th className="text-right px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d3a]">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-[#707a8a]">
                    No withdrawal requests yet
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-[#f5f5f5] transition-colors">
                    <td className="px-4 sm:px-6 py-4 text-[#474d57] text-sm">{formatDateTime(request.created_at)}</td>
                    <td className="px-4 sm:px-6 py-4 text-[#1e2329] font-medium">
                      {formatCurrency(request.amount)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <div>
                        <div className="text-[#1e2329]">
                          {request.destination_type === 'crypto_trc20' ? 'Crypto TRC20' : request.bank_name}
                        </div>
                        <div className="text-sm text-[#707a8a]">{request.account_number}</div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(request)}
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
              {Math.min(meta.current_page * meta.per_page, meta.total)} of </span>{meta.total} requests
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchRequests(meta.current_page - 1)}
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
                onClick={() => fetchRequests(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Withdrawal Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#707a8a]">Request ID</p>
                <p className="text-[#1e2329] font-mono">#{selectedRequest.id}</p>
              </div>
              <div>
                <p className="text-sm text-[#707a8a]">Status</p>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <p className="text-sm text-[#707a8a]">Amount</p>
                <p className="text-[#1e2329] text-lg sm:text-xl font-bold">
                  {formatCurrency(selectedRequest.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#707a8a]">Submitted</p>
                <p className="text-[#1e2329]">{formatDateTime(selectedRequest.created_at)}</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-[#f5f5f5] rounded-lg">
              <h4 className="text-sm font-medium text-[#707a8a] mb-3">Destination Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#707a8a]">Type</p>
                  <p className="text-[#1e2329]">
                    {selectedRequest.destination_type === 'crypto_trc20' ? 'Crypto TRC20' : 'Bank Transfer'}
                  </p>
                </div>
                {selectedRequest.destination_type === 'bank' && (
                  <div>
                    <p className="text-sm text-[#707a8a]">Bank</p>
                    <p className="text-[#1e2329]">{selectedRequest.bank_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[#707a8a]">Account Name</p>
                  <p className="text-[#1e2329]">{selectedRequest.account_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#707a8a]">Account Number</p>
                  <p className="text-[#1e2329] font-mono">{selectedRequest.account_number}</p>
                </div>
              </div>
            </div>

            {selectedRequest.status !== 'pending' && (
              <div className="pt-4 border-t border-[#eaecef]">
                {selectedRequest.processed_at && (
                  <div className="mb-4">
                    <p className="text-sm text-[#707a8a]">Processed at</p>
                    <p className="text-[#1e2329]">{formatDateTime(selectedRequest.processed_at)}</p>
                  </div>
                )}
                {selectedRequest.rejection_reason && (
                  <div className="p-4 bg-[#fce8eb] border border-[#cf304a]/30 rounded-lg">
                    <p className="text-sm text-[#cf304a] font-medium">Rejection Reason</p>
                    <p className="text-[#1e2329] mt-1">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
                {selectedRequest.payout_proof_url && (
                  <div className="mt-4">
                    <p className="text-sm text-[#707a8a] mb-2">Payout Proof</p>
                    <a
                      href={selectedRequest.payout_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#f0b90b] hover:text-[#c99400]"
                    >
                      View Proof
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedRequest(null);
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

export default WithdrawalHistory;
