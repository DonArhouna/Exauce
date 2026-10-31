import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { messageForAuthError } from '@/lib/api-messages';
import { adminPasswordReset } from '@/services/api/endpoints/auth';
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

type ResetValues = z.infer<typeof schema>;

/** Réinitialisation par lien signé (1 h, usage unique côté serveur). */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  const submit = handleSubmit(async (values) => {
    if (!token) return;
    setError(null);
    try {
      await adminPasswordReset({ token, password: values.password });
      setDone(true);
    } catch (caught) {
      setError(messageForAuthError(caught, t, 'auth.resetError'));
    }
  });

  if (!token) {
    return (
      <AuthShell title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
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
    <AuthShell title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
      {done ? (
        <div className="space-y-4">
          <Alert tone="success" title={t('auth.resetSuccess')} />
          <Link
            to="/connexion"
            className="inline-flex h-10 w-full items-center justify-center rounded-control bg-turquoise-600 text-sm font-medium text-white hover:bg-turquoise-700"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      ) : (
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
            {t('auth.resetSubmit')}
          </Button>
          <div className="text-center">
            <Link to="/connexion" className="text-sm text-turquoise-700 underline underline-offset-4">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
