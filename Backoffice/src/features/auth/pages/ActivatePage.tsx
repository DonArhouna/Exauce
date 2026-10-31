import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/useToast';
import { messageForAuthError } from '@/lib/api-messages';
import { DASHBOARD_PATH } from '@/lib/navigation';
import { useAuth } from '@/services/auth/useAuth';
import { AuthShell } from '../components/AuthShell';
import { PasswordInput } from '../components/PasswordInput';

const schema = z
  .object({
    password: z.string().min(14, 'validation.passwordMin'),
    confirm: z.string().min(1, 'validation.required'),
  })
  .refine((values) => values.password === values.confirm, {
    path: ['confirm'],
    message: 'validation.passwordMismatch',
  });

type ActivateValues = z.infer<typeof schema>;

/**
 * Activation d'un compte créé sans mot de passe (`must_reset_password`),
 * via le jeton du lien d'invitation signé.
 */
export default function ActivatePage() {
  const { t } = useTranslation();
  const { activate } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivateValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  const submit = handleSubmit(async (values) => {
    if (!token) return;
    setError(null);
    try {
      await activate({ token, password: values.password });
      push({ title: t('auth.activateSuccess'), tone: 'success' });
      navigate(DASHBOARD_PATH, { replace: true });
    } catch (caught) {
      setError(messageForAuthError(caught, t, 'auth.activateError'));
    }
  });

  if (!token) {
    return (
      <AuthShell title={t('auth.activateTitle')} subtitle={t('auth.activateSubtitle')}>
        <div className="space-y-4">
          <Alert tone="danger" title={t('auth.missingToken')} />
          <Link to="/connexion" className="text-sm text-turquoise-700 underline underline-offset-4">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.activateTitle')} subtitle={t('auth.activateSubtitle')}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error ? <Alert tone="danger" title={error} /> : null}
        <Field
          id="password"
          label={t('auth.newPassword')}
          hint={t('auth.passwordHint')}
          required
          error={errors.password ? t(errors.password.message as string) : undefined}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <Field
          id="confirm"
          label={t('auth.confirmPassword')}
          required
          error={errors.confirm ? t(errors.confirm.message as string) : undefined}
        >
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            invalid={Boolean(errors.confirm)}
            {...register('confirm')}
          />
        </Field>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {t('auth.activateSubmit')}
        </Button>
        <div className="text-center">
          <Link to="/connexion" className="text-sm text-turquoise-700 underline underline-offset-4">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
