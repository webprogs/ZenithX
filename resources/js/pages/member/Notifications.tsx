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
  NotificationsParams,
} from '@/api/member/notifications';
import {
  BellIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
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
      setNotifications(response.data);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'topup_submitted':
      case 'topup_approved':
      case 'topup_rejected':
        return <ArrowTrendingUpIcon className="w-5 h-5" />;
      case 'withdrawal_submitted':
      case 'withdrawal_approved':
      case 'withdrawal_paid':
      case 'withdrawal_rejected':
        return <BanknotesIcon className="w-5 h-5" />;
      case 'account_status_changed':
      case 'interest_rate_changed':
      case 'withdrawal_frozen':
      case 'withdrawal_unfrozen':
        return <ExclamationCircleIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('approved') || type.includes('paid') || type.includes('unfrozen')) {
      return 'bg-emerald-900/30 text-emerald-400';
    }
    if (type.includes('rejected') || type.includes('frozen')) {
      return 'bg-red-900/30 text-red-400';
    }
    if (type.includes('submitted') || type.includes('pending')) {
      return 'bg-amber-900/30 text-amber-400';
    }
    return 'bg-indigo-900/30 text-indigo-400';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400">Stay updated on your account activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            <CheckIcon className="w-5 h-5 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Show:</span>
          <div className="flex gap-2">
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
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <BellIcon className="w-12 h-12 mb-4" />
              <p>No notifications yet</p>
            </div>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors ${
                !notification.read_at ? 'border-l-4 border-l-indigo-500' : ''
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
                      <h3 className="text-white font-medium">{notification.title}</h3>
                      <p className="text-gray-400 mt-1">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
            {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} notifications
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
            <span className="text-sm text-gray-400">
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
