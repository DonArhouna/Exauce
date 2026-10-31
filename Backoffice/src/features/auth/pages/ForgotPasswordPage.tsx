import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { messageForAuthError } from '@/lib/api-messages';
import { adminPasswordForgot } from '@/services/api/endpoints/auth';
import { AuthShell } from '../components/AuthShell';

const schema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.email'),
});

type ForgotValues = z.infer<typeof schema>;

/** Demande de lien de réinitialisation (réponse toujours neutre). */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await adminPasswordForgot(values);
      setSent(true);
    } catch (caught) {
      setError(messageForAuthError(caught, t, 'auth.forgotError'));
    }
  });

  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      {sent ? (
        <div className="space-y-4">
          <Alert tone="success" title={t('auth.forgotSent')} />
          <Link
            to="/connexion"
            className="inline-flex h-10 w-full items-center justify-center rounded-control border border-line bg-surface text-sm font-medium text-ink hover:border-turquoise-400"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error ? <Alert tone="danger" title={error} /> : null}
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
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {t('auth.forgotSubmit')}
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
