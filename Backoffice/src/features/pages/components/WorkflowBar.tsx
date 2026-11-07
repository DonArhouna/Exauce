import { CheckCircle2, Send, Rocket, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { transitionPage, type WorkflowAction } from '@/services/api/endpoints/pages';
import { ApiError } from '@/services/api/problem';
import type { AdminPageDetail } from '@/services/api/types';
import { hasPermission } from '@/services/auth/permissions';
import { useAuth } from '@/services/auth/useAuth';

interface WorkflowBarProps {
  page: AdminPageDetail;
  onUpdated: (page: AdminPageDetail) => void;
  onConflict: () => void;
}

/** Boutons de workflow séparés : soumettre / approuver / rejeter / publier. */
export function WorkflowBar({ page, onUpdated, onConflict }: WorkflowBarProps) {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const [busy, setBusy] = useState<WorkflowAction | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const canEdit = hasPermission(permissions, 'pages', 'edit');
  const canReview = hasPermission(permissions, 'pages', 'review');
  const canPublish = hasPermission(permissions, 'pages', 'publish');

  const run = async (action: WorkflowAction, withComment?: string) => {
    setBusy(action);
    setProblem(null);
    try {
      const updated = await transitionPage(page.id, {
        action,
        revision: page.revision,
        comment: withComment,
      });
      setRejectOpen(false);
      setComment('');
      onUpdated(updated);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          onConflict();
          return;
        }
        setProblem(
          error.problem.detail === 'AUTO_APPROVAL_FORBIDDEN'
            ? t('pages.workflow.autoApproval')
            : (error.problem.detail ?? t('pages.workflow.error')),
        );
        return;
      }
      setProblem(t('pages.workflow.error'));
    } finally {
      setBusy(null);
    }
  };

  const submitReject = () => {
    if (!comment.trim()) {
      setCommentError(t('pages.workflow.commentRequired'));
      return;
    }
    setCommentError(null);
    void run('reject', comment.trim());
  };

  const showSubmit = page.status === 'draft' && canEdit;
  const showReview = page.status === 'in_review' && canReview;
  const showPublish = page.status === 'approved' && canPublish;

  return (
    <div className="space-y-2" data-testid="workflow-bar">
      <div className="flex flex-wrap items-center gap-2">
        {showSubmit ? (
          <Button size="sm" isLoading={busy === 'submit_review'} onClick={() => void run('submit_review')}>
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {t('pages.workflow.submit')}
          </Button>
        ) : null}
        {showReview ? (
          <>
            <Button size="sm" isLoading={busy === 'approve'} onClick={() => void run('approve')}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('pages.workflow.approve')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRejectOpen(true);
                setCommentError(null);
              }}
            >
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t('pages.workflow.reject')}
            </Button>
          </>
        ) : null}
        {showPublish ? (
          <Button size="sm" isLoading={busy === 'publish'} onClick={() => void run('publish')}>
            <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
            {t('pages.workflow.publish')}
          </Button>
        ) : null}
        {!showSubmit && !showReview && !showPublish ? (
          <p className="text-xs text-muted">{t('pages.workflow.none')}</p>
        ) : null}
      </div>

      {problem ? <Alert tone="danger" title={problem} /> : null}

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={t('pages.workflow.rejectTitle')}
        description={t('pages.workflow.rejectDescription')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)} disabled={busy === 'reject'}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={submitReject} isLoading={busy === 'reject'}>
              {t('pages.workflow.reject')}
            </Button>
          </>
        }
      >
        <Field
          id="reject-comment"
          label={t('pages.workflow.comment')}
          required
          error={commentError ?? undefined}
        >
          <Textarea
            id="reject-comment"
            value={comment}
            invalid={Boolean(commentError)}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
      </Modal>
    </div>
  );
}
