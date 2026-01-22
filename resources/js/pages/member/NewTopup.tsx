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
    .min(100, 'Minimum amount is USD 100')
    .max(1000000, 'Maximum amount is USD 1,000,000'),
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" onClick={() => navigate('/member/topup')}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e2329]">New Top-Up</h1>
          <p className="text-[#707a8a]">Submit a new top-up request</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  {...register('amount')}
                  error={errors.amount?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  Payment Method
                </label>
                <select
                  {...register('payment_method')}
                  className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
                >
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  Proof of Payment <span className="text-red-500">*</span>
                </label>
                {proofPreview ? (
                  <div className="relative">
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="max-h-64 w-full object-contain bg-[#f5f5f5] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeProof}
                      className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-[#1e2329] hover:bg-red-700 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#eaecef] rounded-lg cursor-pointer hover:border-[#f0b90b] transition-colors bg-[#f5f5f5]">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <CloudArrowUpIcon className="w-10 h-10 text-[#707a8a] mb-3" />
                      <p className="mb-2 text-sm text-[#707a8a]">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-[#b7b9bc]">PNG, JPG or GIF (max 5MB)</p>
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
                <label className="block text-sm font-medium text-[#474d57] mb-1">
                  Notes (optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
                  placeholder="Any additional information..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => navigate('/member/topup')} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
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
                <span className="text-[#707a8a]">Top-Up Amount</span>
                <span className="text-[#1e2329] font-medium">
                  {formatCurrency(amount || 0)}
                </span>
              </div>
              <div className="pt-4 border-t border-[#eaecef]">
                <p className="text-sm text-[#707a8a]">
                  After submitting your request, an admin will review your proof of payment and
                  approve or reject your top-up. Once approved, the amount will be added to your
                  investment balance.
                </p>
              </div>
            </div>
          </Card>

          <Card className="mt-4 sm:mt-6">
            <CardHeader>
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <div className="space-y-4 text-sm text-[#707a8a]">
              <div>
                <p className="text-[#1e2329] font-medium">GCash</p>
                <p>Send to: 0917 XXX XXXX</p>
                <p>Name: ZenithX Platform</p>
              </div>
              <div>
                <p className="text-[#1e2329] font-medium">Bank Transfer</p>
                <p>Bank: BDO</p>
                <p>Account: 1234 5678 9012</p>
                <p>Name: ZenithX Platform Inc.</p>
              </div>
              <p className="text-xs text-[#b7b9bc]">
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
