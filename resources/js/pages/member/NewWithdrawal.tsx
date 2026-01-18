import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency } from '@/utils/formatters';
import { createWithdrawalRequest, getWithdrawalLimits, WithdrawalLimits } from '@/api/member/withdrawal';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(100, 'Minimum withdrawal is PHP 100'),
  destination_type: z.enum(['bank']),
  account_name: z.string().min(1, 'Account name is required'),
  account_number: z.string().min(1, 'Account number is required'),
  bank_name: z.string().optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

const NewWithdrawal = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      destination_type: 'bank',
    },
  });

  const destinationType = watch('destination_type');
  const amount = watch('amount');

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await getWithdrawalLimits();
        setLimits(response.data);
      } catch {
        toast.error('Failed to load withdrawal limits');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLimits();
  }, []);

  const onSubmit = async (data: WithdrawalFormData) => {
    if (!limits) return;

    if (data.amount > limits.available_balance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await createWithdrawalRequest({
        ...data,
        bank_name: data.destination_type === 'bank' ? data.bank_name : undefined,
      });
      toast.success('Withdrawal request submitted successfully');
      navigate('/member/withdraw');
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const message = error.response?.data?.message || 'Failed to submit withdrawal request';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (limits?.withdrawal_frozen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/member/withdraw')}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#1e2329]">New Withdrawal</h1>
            <p className="text-[#707a8a]">Submit a new withdrawal request</p>
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-4 text-[#c99400]">
            <ExclamationTriangleIcon className="w-12 h-12" />
            <div>
              <h3 className="text-lg font-semibold">Withdrawals Frozen</h3>
              <p className="text-[#707a8a] mt-1">
                Your withdrawal capability has been temporarily frozen. Please contact support for
                more information.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/member/withdraw')}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1e2329]">New Withdrawal</h1>
          <p className="text-[#707a8a]">Submit a new withdrawal request</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  Amount (PHP) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  {...register('amount')}
                  error={errors.amount?.message}
                />
                <p className="mt-1 text-xs text-[#b7b9bc]">
                  Available: {formatCurrency(limits?.available_balance || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  Destination Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="bank"
                      {...register('destination_type')}
                      className="w-4 h-4 text-[#f0b90b] bg-white border-[#eaecef] focus:ring-[#f0b90b]"
                    />
                    <span className="text-[#1e2329]">Bank Transfer</span>
                  </label>
                </div>
              </div>

              {destinationType === 'bank' && (
                <div>
                  <label className="block text-sm font-medium text-[#474d57] mb-1">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('bank_name')}
                    className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
                  >
                    <option value="">Select a bank</option>
                    <option value="BDO">BDO</option>
                    <option value="BPI">BPI</option>
                    <option value="Metrobank">Metrobank</option>
                    <option value="UnionBank">UnionBank</option>
                    <option value="LandBank">LandBank</option>
                    <option value="PNB">PNB</option>
                    <option value="Security Bank">Security Bank</option>
                    <option value="RCBC">RCBC</option>
                    <option value="EastWest">EastWest</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.bank_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.bank_name.message}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter account holder name"
                  {...register('account_name')}
                  error={errors.account_name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  {destinationType === 'gcash' ? 'GCash Number' : 'Account Number'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={
                    destinationType === 'gcash' ? 'e.g., 09171234567' : 'Enter account number'
                  }
                  {...register('account_number')}
                  error={errors.account_number?.message}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/member/withdraw')}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Submit Request
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#707a8a]">Available Balance</span>
                <span className="text-[#1e2329] font-medium">
                  {formatCurrency(limits?.available_balance || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#707a8a]">Withdrawal Amount</span>
                <span className="text-[#1e2329] font-medium">{formatCurrency(amount || 0)}</span>
              </div>
              <div className="pt-4 border-t border-[#eaecef]">
                <div className="flex items-center justify-between">
                  <span className="text-[#707a8a]">Remaining Balance</span>
                  <span className="text-[#1e2329] font-bold">
                    {formatCurrency(Math.max(0, (limits?.available_balance || 0) - (amount || 0)))}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <ul className="space-y-2 text-sm text-[#707a8a]">
              <li className="flex items-start gap-2">
                <span className="text-[#f0b90b]">•</span>
                Minimum withdrawal amount is PHP 100
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#f0b90b]">•</span>
                Withdrawals are processed within 24-48 hours
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#f0b90b]">•</span>
                Please ensure account details are correct
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#f0b90b]">•</span>
                GCash withdrawals are typically faster
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewWithdrawal;
