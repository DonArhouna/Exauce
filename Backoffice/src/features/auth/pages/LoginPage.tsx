import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { messageForAuthError } from '@/lib/api-messages';
import { safeRedirect } from '@/lib/navigation';
import { ApiError } from '@/services/api/problem';
import { useAuth } from '@/services/auth/useAuth';
import { AuthShell } from '../components/AuthShell';
import { PasswordInput } from '../components/PasswordInput';

const schema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

type LoginValues = z.infer<typeof schema>;

/** Connexion back-office : mot de passe puis TOTP si le compte l'exige. */
export default function LoginPage() {
  const { t } = useTranslation();
  const { login, status, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const target = safeRedirect(searchParams.get('redirect'));
  const reason = (location.state as { reason?: string } | null)?.reason;

  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);
  const [mfa, setMfa] = useState<{ email: string; password: string } | null>(null);
  const [code, setCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaPending, setMfaPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (status === 'authenticated') navigate(target, { replace: true });
  }, [status, navigate, target]);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(() => setRetryAfter((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      const response = await login(values);
      if (response.status === 'mfa_required') {
        setMfa(values);
        return;
      }
      navigate(target, { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'RATE_LIMITED' && caught.retryAfter) {
        setRetryAfter(caught.retryAfter);
      }
      setError(messageForAuthError(caught, t, 'auth.genericError'));
    }
  });

  const submitMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mfa) return;
    if (!/^\d{6,8}$/.test(code)) {
      setMfaError(t('auth.mfaInvalid'));
      return;
    }
    setMfaError(null);
    setMfaPending(true);
    try {
      const response = await login({ ...mfa, totp_code: code });
      if (response.status === 'authenticated') navigate(target, { replace: true });
      else setMfaError(t('auth.mfaRequired'));
    } catch (caught) {
      setMfaError(messageForAuthError(caught, t, 'auth.genericError'));
    } finally {
      setMfaPending(false);
    }
  };

  if (status === 'authenticated') return <Navigate to={target} replace />;

  const expired = sessionExpired || reason === 'session_expired';

  return (
    <AuthShell
      title={mfa ? t('auth.mfaTitle') : t('auth.loginTitle')}
      subtitle={mfa ? t('auth.mfaSubtitle') : t('auth.loginSubtitle')}
      footer={t('app.title')}
    >
      {expired && !error ? <Alert tone="warning" title={t('auth.sessionExpired')} className="mb-4" /> : null}

      {mfa ? (
        <form onSubmit={submitMfa} className="space-y-4" noValidate>
          {mfaError ? <Alert tone="danger" title={mfaError} /> : null}
          <Field id="totp" label={t('auth.mfaCode')}>
            <Input
              id="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
          </Field>
          <Button type="submit" className="w-full" isLoading={mfaPending}>
            {t('auth.mfaSubmit')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setMfa(null);
              setCode('');
              setMfaError(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('auth.mfaBack')}
          </Button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && retryAfter <= 0 ? <Alert tone="danger" title={error} /> : null}
          {retryAfter > 0 ? <Alert tone="warning" title={t('auth.rateLimited', { seconds: retryAfter })} /> : null}

          <Field id="email" label={t('auth.email')} required error={errors.email ? t(errors.email.message as string) : undefined}>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder={t('auth.emailPlaceholder')}
              invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </Field>

          <Field
            id="password"
            label={t('auth.password')}
            required
            error={errors.password ? t(errors.password.message as string) : undefined}
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </Field>

          <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={retryAfter > 0}>
            {isSubmitting ? t('auth.submitting') : t('auth.submit')}
          </Button>

          <div className="text-center">
            <Link
              to="/mot-de-passe-oublie"
              className="text-sm font-medium text-turquoise-700 underline underline-offset-4 hover:text-turquoise-600"
            >
              {t('auth.forgot')}
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
