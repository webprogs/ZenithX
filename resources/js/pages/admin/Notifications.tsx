import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Notification } from '@/types';
import { formatRelativeTime } from '@/utils/formatters';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  NotificationsParams,
} from '@/api/admin/notifications';
import {
  BellIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const Notifications = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifications = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: NotificationsParams = {
        page,
        per_page: 15,
        unread_only: showUnreadOnly || undefined,
      };

      const response = await getNotifications(params);
      setNotifications(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [showUnreadOnly]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read_at) return;
    try {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications? This cannot be undone.')) {
      return;
    }
    try {
      await clearAllNotifications();
      setNotifications([]);
      setMeta({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_topup_request':
      case 'topup_processed':
        return <CurrencyDollarIcon className="w-5 h-5" />;
      case 'new_withdrawal_request':
      case 'withdrawal_processed':
        return <CurrencyDollarIcon className="w-5 h-5" />;
      case 'new_member_registered':
      case 'member_status_changed':
        return <UserGroupIcon className="w-5 h-5" />;
      case 'system_alert':
        return <ExclamationCircleIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('approved') || type.includes('completed') || type.includes('success')) {
      return 'bg-[#e6f7f0] text-[#03a66d]';
    }
    if (type.includes('rejected') || type.includes('failed') || type.includes('alert')) {
      return 'bg-[#fce8eb] text-[#cf304a]';
    }
    if (type.includes('pending') || type.includes('new_')) {
      return 'bg-[#fef6d8] text-[#c99400]';
    }
    return 'bg-[#fef6d8] text-[#f0b90b]';
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (isLoading && notifications.length === 0) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">Notifications</h1>
          <p className="text-[#707a8a]">System alerts and activity updates</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={handleMarkAllAsRead}>
              <CheckIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Mark All as Read</span>
              <span className="sm:hidden">Mark Read</span>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="danger" onClick={handleClearAll}>
              <TrashIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm text-[#707a8a]">Show:</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!showUnreadOnly ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowUnreadOnly(false)}
            >
              All
            </Button>
            <Button
              variant={showUnreadOnly ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowUnreadOnly(true)}
            >
              Unread Only
              {unreadCount > 0 && (
                <Badge variant="warning" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-[#707a8a]">
              <BellIcon className="w-12 h-12 mb-4" />
              <p>No notifications yet</p>
            </div>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors ${
                !notification.read_at ? 'border-l-4 border-l-[#f0b90b]' : ''
              }`}
              onClick={() => handleMarkAsRead(notification)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[#1e2329] font-medium">{notification.title}</h3>
                      <p className="text-[#707a8a] mt-1">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-[#b7b9bc]">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-[#f0b90b] rounded-full" />
                      )}
                      <button
                        onClick={(e) => handleDelete(e, notification)}
                        className="p-1 text-[#b7b9bc] hover:text-[#cf304a] transition-colors"
                        title="Delete notification"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#707a8a]">
            <span className="hidden sm:inline">Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
            {Math.min(meta.current_page * meta.per_page, meta.total)} of </span>{meta.total} notifications
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchNotifications(meta.current_page - 1)}
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
              onClick={() => fetchNotifications(meta.current_page + 1)}
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

export default Notifications;
