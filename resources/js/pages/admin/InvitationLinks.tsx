import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { InvitationLink, User } from '@/types';
import { formatDateTime, formatDate, formatPercentage } from '@/utils/formatters';
import {
  getInvitationLinks,
  createInvitationLink,
  updateInvitationLink,
  deactivateInvitationLink,
  CreateInvitationLinkData,
  UpdateInvitationLinkData,
} from '@/api/admin/invitationLinks';
import {
  PlusIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const createSchema = z.object({
  interest_rate: z.coerce
    .number()
    .min(0, 'Interest rate must be at least 0')
    .max(100, 'Interest rate cannot exceed 100'),
  assigned_role: z.enum(['admin', 'member']),
  max_uses: z.coerce.number().min(1, 'Must be at least 1').nullable().optional(),
  expires_at: z.string().nullable().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
});

const updateSchema = z.object({
  interest_rate: z.coerce
    .number()
    .min(0, 'Interest rate must be at least 0')
    .max(100, 'Interest rate cannot exceed 100')
    .optional(),
  max_uses: z.coerce.number().min(1, 'Must be at least 1').nullable().optional(),
  expires_at: z.string().nullable().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
  is_active: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

const InvitationLinks = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [links, setLinks] = useState<InvitationLink[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<InvitationLink | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      interest_rate: 5,
      assigned_role: 'member',
      max_uses: null,
      expires_at: null,
      notes: null,
    },
  });

  const updateForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
  });

  const fetchLinks = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await getInvitationLinks({
        page,
        per_page: 15,
        active: activeFilter,
        sort: 'created_at',
        direction: 'desc',
      });
      setLinks(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch invitation links:', error);
      toast.error('Failed to load invitation links');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [activeFilter]);

  const handleCopyLink = async (link: InvitationLink) => {
    const url = `${window.location.origin}/register/${link.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleCreate = async (data: CreateFormData) => {
    setIsSubmitting(true);
    try {
      const payload: CreateInvitationLinkData = {
        interest_rate: data.interest_rate,
        assigned_role: data.assigned_role,
        max_uses: data.max_uses || null,
        expires_at: data.expires_at || null,
        notes: data.notes || null,
      };
      await createInvitationLink(payload);
      toast.success('Invitation link created successfully');
      setIsCreateModalOpen(false);
      createForm.reset();
      fetchLinks();
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const message = error.response?.data?.message || 'Failed to create invitation link';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (link: InvitationLink) => {
    setSelectedLink(link);
    updateForm.reset({
      interest_rate: Number(link.interest_rate),
      max_uses: link.max_uses,
      expires_at: link.expires_at ? link.expires_at.slice(0, 16) : null,
      notes: link.notes,
      is_active: link.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: UpdateFormData) => {
    if (!selectedLink) return;
    setIsSubmitting(true);
    try {
      const payload: UpdateInvitationLinkData = {
        interest_rate: data.interest_rate,
        max_uses: data.max_uses || null,
        expires_at: data.expires_at || null,
        notes: data.notes || null,
        is_active: data.is_active,
      };
      await updateInvitationLink(selectedLink.id, payload);
      toast.success('Invitation link updated successfully');
      setIsEditModalOpen(false);
      setSelectedLink(null);
      fetchLinks();
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const message = error.response?.data?.message || 'Failed to update invitation link';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (link: InvitationLink) => {
    if (!confirm('Are you sure you want to deactivate this invitation link?')) return;
    try {
      await deactivateInvitationLink(link.id);
      toast.success('Invitation link deactivated');
      fetchLinks();
    } catch {
      toast.error('Failed to deactivate invitation link');
    }
  };

  const handleViewRegistrations = (link: InvitationLink) => {
    setSelectedLink(link);
    setIsViewModalOpen(true);
  };

  const getLinkStatus = (link: InvitationLink) => {
    if (!link.is_active) {
      return { label: 'Inactive', variant: 'danger' as const };
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return { label: 'Expired', variant: 'warning' as const };
    }
    if (link.max_uses !== null && link.times_used >= link.max_uses) {
      return { label: 'Exhausted', variant: 'warning' as const };
    }
    return { label: 'Active', variant: 'success' as const };
  };

  if (isLoading && links.length === 0) {
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
          <h1 className="text-2xl font-bold text-[#1e2329]">Invitation Links</h1>
          <p className="text-[#707a8a]">Manage invitation codes for new user registration</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Link
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#707a8a]">Filter by status:</span>
          <div className="flex gap-2">
            <Button
              variant={activeFilter === undefined ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveFilter(undefined)}
            >
              All
            </Button>
            <Button
              variant={activeFilter === true ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveFilter(true)}
            >
              Active
            </Button>
            <Button
              variant={activeFilter === false ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveFilter(false)}
            >
              Inactive
            </Button>
          </div>
        </div>
      </Card>

      {/* Links Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eaecef]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#707a8a]">Code</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#707a8a]">Interest Rate</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#707a8a]">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#707a8a]">Usage</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#707a8a]">Expires</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#707a8a]">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#707a8a]">Created</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[#707a8a]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d3a]">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#707a8a]">
                    No invitation links found
                  </td>
                </tr>
              ) : (
                links.map((link) => {
                  const status = getLinkStatus(link);
                  return (
                    <tr key={link.id} className="hover:bg-[#f5f5f5] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-[#b7b9bc]" />
                          <code className="text-[#1e2329] font-mono">{link.code}</code>
                          <button
                            onClick={() => handleCopyLink(link)}
                            className="p-1 text-[#707a8a] hover:text-[#1e2329] transition-colors"
                            title="Copy link"
                          >
                            {copiedId === link.id ? (
                              <CheckIcon className="w-4 h-4 text-[#03a66d]" />
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#1e2329]">
                        {formatPercentage(Number(link.interest_rate))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={link.assigned_role === 'admin' ? 'info' : 'default'}>
                          {link.assigned_role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[#1e2329]">
                        {link.times_used}
                        {link.max_uses !== null && ` / ${link.max_uses}`}
                        {link.times_used > 0 && (
                          <button
                            onClick={() => handleViewRegistrations(link)}
                            className="ml-2 text-[#f0b90b] hover:text-indigo-300 transition-colors"
                            title="View registrations"
                          >
                            <UsersIcon className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#474d57]">
                        {link.expires_at ? formatDate(link.expires_at) : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-[#474d57]">
                        <div className="text-sm">{formatDateTime(link.created_at)}</div>
                        {link.creator && (
                          <div className="text-xs text-[#b7b9bc]">by {link.creator.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {link.times_used > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRegistrations(link)}
                              title="View registrations"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(link)}
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </Button>
                          {link.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(link)}
                              title="Deactivate"
                              className="text-[#cf304a] hover:text-red-300"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#eaecef]">
            <div className="text-sm text-[#707a8a]">
              Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
              {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} links
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchLinks(meta.current_page - 1)}
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
                onClick={() => fetchLinks(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Invitation Link"
        size="lg"
      >
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.01"
              {...createForm.register('interest_rate')}
              error={createForm.formState.errors.interest_rate?.message}
            />
            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">
                Assigned Role
              </label>
              <select
                {...createForm.register('assigned_role')}
                className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              {createForm.formState.errors.assigned_role && (
                <p className="mt-1 text-sm text-red-500">
                  {createForm.formState.errors.assigned_role.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Uses (leave empty for unlimited)"
              type="number"
              {...createForm.register('max_uses')}
              error={createForm.formState.errors.max_uses?.message}
            />
            <Input
              label="Expires At (optional)"
              type="datetime-local"
              {...createForm.register('expires_at')}
              error={createForm.formState.errors.expires_at?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#474d57] mb-1">
              Notes (optional)
            </label>
            <textarea
              {...createForm.register('notes')}
              rows={3}
              className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
              placeholder="Add any notes about this invitation link..."
            />
            {createForm.formState.errors.notes && (
              <p className="mt-1 text-sm text-red-500">
                {createForm.formState.errors.notes.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Link
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLink(null);
        }}
        title="Edit Invitation Link"
        size="lg"
      >
        {selectedLink && (
          <form onSubmit={updateForm.handleSubmit(handleUpdate)} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-[#f5f5f5] rounded-lg mb-4">
              <LinkIcon className="w-5 h-5 text-[#b7b9bc]" />
              <code className="text-[#1e2329] font-mono text-lg">{selectedLink.code}</code>
              <button
                type="button"
                onClick={() => handleCopyLink(selectedLink)}
                className="ml-auto p-2 text-[#707a8a] hover:text-[#1e2329] transition-colors"
              >
                <ClipboardDocumentIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Interest Rate (%)"
                type="number"
                step="0.01"
                {...updateForm.register('interest_rate')}
                error={updateForm.formState.errors.interest_rate?.message}
              />
              <div>
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  Status
                </label>
                <select
                  {...updateForm.register('is_active')}
                  className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Uses"
                type="number"
                {...updateForm.register('max_uses')}
                error={updateForm.formState.errors.max_uses?.message}
              />
              <Input
                label="Expires At"
                type="datetime-local"
                {...updateForm.register('expires_at')}
                error={updateForm.formState.errors.expires_at?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#474d57] mb-1">
                Notes
              </label>
              <textarea
                {...updateForm.register('notes')}
                rows={3}
                className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedLink(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Registrations Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedLink(null);
        }}
        title="Registrations"
        size="lg"
      >
        {selectedLink && (
          <div>
            <div className="flex items-center gap-2 p-3 bg-[#f5f5f5] rounded-lg mb-4">
              <LinkIcon className="w-5 h-5 text-[#b7b9bc]" />
              <code className="text-[#1e2329] font-mono">{selectedLink.code}</code>
              <Badge variant="default" className="ml-auto">
                {selectedLink.times_used} registration{selectedLink.times_used !== 1 ? 's' : ''}
              </Badge>
            </div>

            {selectedLink.registrations && selectedLink.registrations.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedLink.registrations.map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-lg"
                  >
                    <div>
                      <div className="text-[#1e2329] font-medium">{user.name}</div>
                      <div className="text-sm text-[#707a8a]">@{user.username}</div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'success'
                            : user.status === 'inactive'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {user.status}
                      </Badge>
                      <div className="text-xs text-[#b7b9bc] mt-1">
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#707a8a]">
                No registrations yet
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedLink(null);
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

export default InvitationLinks;
