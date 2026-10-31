import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/useToast';
import { usePublicationStatus } from '@/hooks/usePublicationStatus';
import { triggerPublication } from '@/services/api/endpoints/publication';
import { ApiError } from '@/services/api/problem';
import { hasAnyPermission } from '@/services/auth/permissions';
import { useAuth } from '@/services/auth/useAuth';

/** Bouton « Publier » : visible seulement avec `pages:publish`. */
export function PublishButton() {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const { data } = usePublicationStatus();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allowed = hasAnyPermission(permissions, 'pages', 'publish');
  const building = data?.site_status === 'building';

  const mutation = useMutation({
    mutationFn: triggerPublication,
    onSuccess: () => {
      push({ title: t('publication.success'), tone: 'success' });
      setConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['publication'] });
      void queryClient.invalidateQueries({ queryKey: ['publication', 'jobs'] });
    },
    onError: (error: unknown) => {
      const conflict = error instanceof ApiError && error.code === 'CONFLICT';
      push({
        title: conflict ? t('publication.conflict') : t('errors.server'),
        tone: 'error',
      });
    },
  });

  if (!allowed) return null;

  return (
    <>
      <Button
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={building}
        isLoading={mutation.isPending}
        className="hidden sm:inline-flex"
      >
        {building ? t('publication.publishing') : t('publication.publish')}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('publication.confirmTitle')}
        description={t('publication.confirmText')}
        confirmLabel={t('publication.confirm')}
        isLoading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}
