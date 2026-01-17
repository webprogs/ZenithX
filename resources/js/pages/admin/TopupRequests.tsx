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
import { TopupRequest } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import {
  getTopupRequests,
  getTopupRequest,
  approveTopupRequest,
  rejectTopupRequest,
  TopupRequestsParams,
} from '@/api/admin/topupRequests';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const rejectSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
  admin_remarks: z.string().optional(),
});

type RejectFormData = z.infer<typeof rejectSchema>;

const TopupRequests = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | undefined>(
    (searchParams.get('status') as 'pending' | 'approved' | 'rejected') || undefined
  );
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const rejectForm = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
  });

  const fetchRequests = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: TopupRequestsParams = {
        page,
        per_page: 15,
        sort: 'created_at',
        direction: 'desc',
      };
      if (statusFilter) params.status = statusFilter;
      const userId = searchParams.get('user_id');
      if (userId) params.user_id = Number(userId);

      const response = await getTopupRequests(params);
      setRequests(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load top-up requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, searchParams]);

  const handleView = async (request: TopupRequest) => {
    try {
      const response = await getTopupRequest(request.id);
      setSelectedRequest(response.data);
      setIsViewModalOpen(true);
    } catch {
      toast.error('Failed to load request details');
    }
  };

  const handleApprove = async (request: TopupRequest) => {
    if (!confirm('Are you sure you want to approve this top-up request?')) return;
    setIsProcessing(true);
    try {
      await approveTopupRequest(request.id);
      toast.success('Top-up request approved successfully');
      fetchRequests(meta.current_page);
      setIsViewModalOpen(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRejectModal = (request: TopupRequest) => {
    setSelectedRequest(request);
    rejectForm.reset();
    setIsRejectModalOpen(true);
  };

  const handleReject = async (data: RejectFormData) => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      await rejectTopupRequest(selectedRequest.id, data);
      toast.success('Top-up request rejected');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Top-Up Requests</h1>
        <p className="text-gray-400">Review and process top-up requests</p>
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
              <tr className="border-b border-[#2d2d3a]">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Member</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Method</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d3a]">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No top-up requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-[#1a1a24] transition-colors">
                    <td className="px-6 py-4 text-white font-mono">#{request.id}</td>
                    <td className="px-6 py-4 text-gray-300">{formatDateTime(request.created_at)}</td>
                    <td className="px-6 py-4">
                      {request.user ? (
                        <div>
                          <div className="text-white">{request.user.name}</div>
                          <div className="text-sm text-gray-400">@{request.user.username}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {formatCurrency(request.amount)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{request.payment_method || 'N/A'}</td>
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
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
                              className="text-emerald-400 hover:text-emerald-300"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRejectModal(request)}
                              title="Reject"
                              className="text-red-400 hover:text-red-300"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </>
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d2d3a]">
            <div className="text-sm text-gray-400">
              Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
              {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} requests
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
              <span className="text-sm text-gray-400">
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
        title="Top-Up Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Request ID</p>
                <p className="text-white font-mono">#{selectedRequest.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Member</p>
                <p className="text-white">
                  {selectedRequest.user?.name || 'Unknown'}
                  <span className="text-gray-400 ml-1">
                    (@{selectedRequest.user?.username})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p className="text-white text-xl font-bold">
                  {formatCurrency(selectedRequest.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Payment Method</p>
                <p className="text-white">{selectedRequest.payment_method || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Submitted</p>
                <p className="text-white">{formatDateTime(selectedRequest.created_at)}</p>
              </div>
            </div>

            {selectedRequest.notes && (
              <div>
                <p className="text-sm text-gray-400">Notes</p>
                <p className="text-white mt-1">{selectedRequest.notes}</p>
              </div>
            )}

            {selectedRequest.proof_of_payment_url && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Proof of Payment</p>
                <a
                  href={selectedRequest.proof_of_payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative bg-[#1a1a24] rounded-lg overflow-hidden">
                    <img
                      src={selectedRequest.proof_of_payment_url}
                      alt="Proof of payment"
                      className="max-h-64 w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                      <PhotoIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </a>
              </div>
            )}

            {selectedRequest.status !== 'pending' && (
              <div className="pt-4 border-t border-[#2d2d3a]">
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.processor && (
                    <div>
                      <p className="text-sm text-gray-400">Processed by</p>
                      <p className="text-white">{selectedRequest.processor.name}</p>
                    </div>
                  )}
                  {selectedRequest.processed_at && (
                    <div>
                      <p className="text-sm text-gray-400">Processed at</p>
                      <p className="text-white">{formatDateTime(selectedRequest.processed_at)}</p>
                    </div>
                  )}
                </div>
                {selectedRequest.rejection_reason && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400">Rejection Reason</p>
                    <p className="text-red-400 mt-1">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
                {selectedRequest.admin_remarks && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400">Admin Remarks</p>
                    <p className="text-white mt-1">{selectedRequest.admin_remarks}</p>
                  </div>
                )}
              </div>
            )}

            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-[#2d2d3a]">
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
        title="Reject Top-Up Request"
      >
        <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              {...rejectForm.register('rejection_reason')}
              rows={3}
              className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Explain why this request is being rejected..."
            />
            {rejectForm.formState.errors.rejection_reason && (
              <p className="mt-1 text-sm text-red-500">
                {rejectForm.formState.errors.rejection_reason.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Admin Remarks (optional)
            </label>
            <textarea
              {...rejectForm.register('admin_remarks')}
              rows={2}
              className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
    </div>
  );
};

export default TopupRequests;
