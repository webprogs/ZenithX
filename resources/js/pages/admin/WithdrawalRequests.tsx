import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { WithdrawalRequest } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import {
  getWithdrawalRequests,
  getWithdrawalRequest,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  markWithdrawalPaid,
  WithdrawalRequestsParams,
} from '@/api/admin/withdrawalRequests';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const rejectSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
  admin_remarks: z.string().optional(),
});

type RejectFormData = z.infer<typeof rejectSchema>;

const WithdrawalRequests = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'paid' | 'rejected' | undefined>(
    (searchParams.get('status') as 'pending' | 'approved' | 'paid' | 'rejected') || undefined
  );
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payoutProof, setPayoutProof] = useState<File | null>(null);

  const rejectForm = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
  });

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
      const userId = searchParams.get('user_id');
      if (userId) params.user_id = Number(userId);

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
  }, [statusFilter, searchParams]);

  const handleView = async (request: WithdrawalRequest) => {
    try {
      const response = await getWithdrawalRequest(request.id);
      setSelectedRequest(response.data);
      setIsViewModalOpen(true);
    } catch {
      toast.error('Failed to load request details');
    }
  };

  const handleApprove = async (request: WithdrawalRequest) => {
    if (!confirm('Are you sure you want to approve this withdrawal request?')) return;
    setIsProcessing(true);
    try {
      await approveWithdrawalRequest(request.id);
      toast.success('Withdrawal request approved');
      fetchRequests(meta.current_page);
      setIsViewModalOpen(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRejectModal = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    rejectForm.reset();
    setIsRejectModalOpen(true);
  };

  const handleReject = async (data: RejectFormData) => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      await rejectWithdrawalRequest(selectedRequest.id, data);
      toast.success('Withdrawal request rejected');
      fetchRequests(meta.current_page);
      setIsRejectModalOpen(false);
      setIsViewModalOpen(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPaidModal = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setPayoutProof(null);
    setIsPaidModalOpen(true);
  };

  const handleMarkPaid = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      if (payoutProof) {
        formData.append('payout_proof', payoutProof);
      }
      await markWithdrawalPaid(selectedRequest.id, formData);
      toast.success('Withdrawal marked as paid');
      fetchRequests(meta.current_page);
      setIsPaidModalOpen(false);
      setIsViewModalOpen(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setIsProcessing(false);
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">Withdrawal Requests</h1>
        <p className="text-[#707a8a]">Review and process withdrawal requests</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm text-[#707a8a]">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
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

      {/* Requests Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eaecef]">
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a] hidden sm:table-cell">ID</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a] hidden md:table-cell">Date</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Member</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Amount</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a] hidden lg:table-cell">Destination</th>
                <th className="text-left px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Status</th>
                <th className="text-right px-4 sm:px-6 py-4 text-sm font-medium text-[#707a8a]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d3a]">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#707a8a]">
                    No withdrawal requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-[#f5f5f5] transition-colors">
                    <td className="px-4 sm:px-6 py-4 text-[#1e2329] font-mono hidden sm:table-cell">#{request.id}</td>
                    <td className="px-4 sm:px-6 py-4 text-[#474d57] hidden md:table-cell">{formatDateTime(request.created_at)}</td>
                    <td className="px-4 sm:px-6 py-4">
                      {request.user ? (
                        <div>
                          <div className="text-[#1e2329]">{request.user.name}</div>
                          <div className="text-sm text-[#707a8a]">@{request.user.username}</div>
                        </div>
                      ) : (
                        <span className="text-[#707a8a]">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-[#1e2329] font-medium">
                      {formatCurrency(request.amount)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                      <div>
                        <div className="text-[#1e2329]">
                          {request.destination_type === 'crypto_trc20' ? 'Crypto TRC 20' : request.bank_name}
                        </div>
                        <div className="text-sm text-[#707a8a]">{request.account_number}</div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(request)}
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request)}
                              title="Approve"
                              className="text-[#03a66d] hover:text-emerald-300"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRejectModal(request)}
                              title="Reject"
                              className="text-[#cf304a] hover:text-red-300"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPaidModal(request)}
                            title="Mark as Paid"
                            className="text-[#0070f3] hover:text-cyan-300"
                          >
                            <BanknotesIcon className="w-4 h-4" />
                          </Button>
                        )}
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
          <div className="space-y-6">
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
                <p className="text-sm text-[#707a8a]">Member</p>
                <p className="text-[#1e2329]">
                  {selectedRequest.user?.name || 'Unknown'}
                  <span className="text-[#707a8a] ml-1">
                    (@{selectedRequest.user?.username})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-[#707a8a]">Amount</p>
                <p className="text-[#1e2329] text-xl font-bold">
                  {formatCurrency(selectedRequest.amount)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#f5f5f5] rounded-lg">
              <h4 className="text-sm font-medium text-[#707a8a] mb-3">Destination Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#707a8a]">Type</p>
                  <p className="text-[#1e2329]">
                    {selectedRequest.destination_type === 'crypto_trc20' ? 'Crypto TRC 20' : 'Bank Transfer'}
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

            <div>
              <p className="text-sm text-[#707a8a]">Submitted</p>
              <p className="text-[#1e2329]">{formatDateTime(selectedRequest.created_at)}</p>
            </div>

            {selectedRequest.status !== 'pending' && (
              <div className="pt-4 border-t border-[#eaecef]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedRequest.processor && (
                    <div>
                      <p className="text-sm text-[#707a8a]">Processed by</p>
                      <p className="text-[#1e2329]">{selectedRequest.processor.name}</p>
                    </div>
                  )}
                  {selectedRequest.processed_at && (
                    <div>
                      <p className="text-sm text-[#707a8a]">Processed at</p>
                      <p className="text-[#1e2329]">{formatDateTime(selectedRequest.processed_at)}</p>
                    </div>
                  )}
                </div>
                {selectedRequest.rejection_reason && (
                  <div className="mt-4">
                    <p className="text-sm text-[#707a8a]">Rejection Reason</p>
                    <p className="text-[#cf304a] mt-1">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
                {selectedRequest.payout_proof_url && (
                  <div className="mt-4">
                    <p className="text-sm text-[#707a8a] mb-2">Payout Proof</p>
                    <a
                      href={selectedRequest.payout_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#f0b90b] hover:text-indigo-300"
                    >
                      View Proof
                    </a>
                  </div>
                )}
              </div>
            )}

            {selectedRequest.status === 'pending' && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#eaecef]">
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenRejectModal(selectedRequest);
                  }}
                >
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedRequest)} isLoading={isProcessing}>
                  Approve
                </Button>
              </div>
            )}

            {selectedRequest.status === 'approved' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-[#eaecef]">
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenPaidModal(selectedRequest);
                  }}
                >
                  <BanknotesIcon className="w-4 h-4 mr-2" />
                  Mark as Paid
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Reject Withdrawal Request"
      >
        <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#474d57] mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              {...rejectForm.register('rejection_reason')}
              rows={3}
              className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
              placeholder="Explain why this request is being rejected..."
            />
            {rejectForm.formState.errors.rejection_reason && (
              <p className="mt-1 text-sm text-red-500">
                {rejectForm.formState.errors.rejection_reason.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#474d57] mb-1">
              Admin Remarks (optional)
            </label>
            <textarea
              {...rejectForm.register('admin_remarks')}
              rows={2}
              className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={isProcessing}>
              Reject Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal
        isOpen={isPaidModalOpen}
        onClose={() => {
          setIsPaidModalOpen(false);
          setSelectedRequest(null);
          setPayoutProof(null);
        }}
        title="Mark as Paid"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 bg-[#f5f5f5] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#707a8a]">Amount</p>
                  <p className="text-xl font-bold text-[#1e2329]">
                    {formatCurrency(selectedRequest.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#707a8a]">To</p>
                  <p className="text-[#1e2329]">{selectedRequest.account_name}</p>
                  <p className="text-sm text-[#707a8a]">{selectedRequest.account_number}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">
                Payout Proof (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPayoutProof(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-[#1e2329] file:cursor-pointer"
              />
              <p className="mt-1 text-xs text-[#b7b9bc]">
                Upload a screenshot of the payout confirmation
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsPaidModalOpen(false);
                  setSelectedRequest(null);
                  setPayoutProof(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleMarkPaid} isLoading={isProcessing}>
                Confirm Paid
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WithdrawalRequests;
