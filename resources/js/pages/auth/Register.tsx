import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { validateInvitation } from '@/api/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { InvitationLink } from '@/types';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { register: registerUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [invitation, setInvitation] = useState<Partial<InvitationLink> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const validate = async () => {
      if (!code) {
        setError('No invitation code provided.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await validateInvitation(code);
        setInvitation(response.data);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message || 'Invalid invitation code.');
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [code]);

  const onSubmit = async (data: RegisterFormData) => {
    if (!code) return;

    setIsLoading(true);
    try {
      await registerUser({
        invitation_code: code,
        ...data,
      });
      const user = useAuthStore.getState().user;
      const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
      navigate(redirectPath);
      toast.success('Registration successful!');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const message = axiosError.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-[#cf304a] mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1e2329] mb-2">Invalid Invitation</h2>
          <p className="text-[#707a8a] mb-6">{error}</p>
          <Link to="/login">
            <Button variant="secondary">Back to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f0b90b] rounded-xl flex items-center justify-center">
              <span className="text-[#1e2329] font-bold text-lg sm:text-xl">ZX</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2329]">Create Account</h1>
          <p className="text-[#707a8a] mt-2">
            Interest Rate: <span className="text-[#03a66d] font-semibold">{invitation?.interest_rate}%</span>
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="Choose a username"
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone (Optional)"
              type="tel"
              placeholder="Enter your phone number"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              error={errors.password_confirmation?.message}
              {...register('password_confirmation')}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>
        </Card>

        <p className="text-center text-[#707a8a] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#f0b90b] hover:text-[#d9a60a]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
