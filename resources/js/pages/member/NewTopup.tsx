import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/utils/formatters';
import { createTopupRequest } from '@/api/member/topup';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const topupSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, 'Minimum amount is PHP 100')
    .max(1000000, 'Maximum amount is PHP 1,000,000'),
  payment_method: z.string().optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

type TopupFormData = z.infer<typeof topupSchema>;

const NewTopup = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TopupFormData>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      amount: 1000,
      payment_method: 'GCash',
    },
  });

  const amount = watch('amount');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview(null);
  };

  const onSubmit = async (data: TopupFormData) => {
    if (!proofFile) {
      toast.error('Please upload proof of payment');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', data.amount.toString());
      if (data.payment_method) formData.append('payment_method', data.payment_method);
      if (data.notes) formData.append('notes', data.notes);
      formData.append('proof_of_payment', proofFile);

      await createTopupRequest(formData);
      toast.success('Top-up request submitted successfully');
      navigate('/member/topup');
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const message = error.response?.data?.message || 'Failed to submit top-up request';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/member/topup')}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Top-Up</h1>
          <p className="text-gray-400">Submit a new top-up request</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount (PHP) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  {...register('amount')}
                  error={errors.amount?.message}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum: PHP 100 | Maximum: PHP 1,000,000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  {...register('payment_method')}
                  className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Proof of Payment <span className="text-red-500">*</span>
                </label>
                {proofPreview ? (
                  <div className="relative">
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="max-h-64 w-full object-contain bg-[#1a1a24] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeProof}
                      className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#2d2d3a] rounded-lg cursor-pointer hover:border-indigo-500 transition-colors bg-[#1a1a24]">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF (max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#16161f] border border-[#2d2d3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any additional information..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => navigate('/member/topup')}>
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
                <span className="text-gray-400">Top-Up Amount</span>
                <span className="text-white font-medium">
                  {formatCurrency(amount || 0)}
                </span>
              </div>
              <div className="pt-4 border-t border-[#2d2d3a]">
                <p className="text-sm text-gray-400">
                  After submitting your request, an admin will review your proof of payment and
                  approve or reject your top-up. Once approved, the amount will be added to your
                  investment balance.
                </p>
              </div>
            </div>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <div className="space-y-4 text-sm text-gray-400">
              <div>
                <p className="text-white font-medium">GCash</p>
                <p>Send to: 0917 XXX XXXX</p>
                <p>Name: ZenithX Platform</p>
              </div>
              <div>
                <p className="text-white font-medium">Bank Transfer</p>
                <p>Bank: BDO</p>
                <p>Account: 1234 5678 9012</p>
                <p>Name: ZenithX Platform Inc.</p>
              </div>
              <p className="text-xs text-gray-500">
                Please include your username as reference when sending payment.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewTopup;
