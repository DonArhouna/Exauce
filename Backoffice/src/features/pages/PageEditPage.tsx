import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  StatusPill,
} from '@/components/ui';
import {
  PAGE_STATUS_LABEL,
  createSection,
  getPage,
  getSectionTypes,
  patchPage,
  patchSection,
  removeSection,
} from '@/services/api/endpoints/pages';
import { listOffices } from '@/services/api/endpoints/offices';
import { ApiError } from '@/services/api/problem';
import type { AdminPageDetail, ContentLang, PageStatus } from '@/services/api/types';
import { hasPermission } from '@/services/auth/permissions';
import { useAuth } from '@/services/auth/useAuth';
import { useEditionLanguage } from '@/services/edition/useEditionLanguage';
import { PagePanel } from './components/PagePanel';
import { PagePreview } from './components/PagePreview';
import { SectionCard } from './components/SectionCard';
import { WorkflowBar } from './components/WorkflowBar';

const STATUS_TONE: Record<PageStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
  draft: 'neutral',
  in_review: 'warning',
  approved: 'info',
  published: 'success',
  archived: 'neutral',
};

/** Édition d'une page et de ses blocs (`/pages/:id`). */
export default function PageEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { lang } = useEditionLanguage();
  const { permissions, user } = useAuth();

  const pageQuery = useQuery({ queryKey: ['page', id], queryFn: () => getPage(id), enabled: Boolean(id) });
  const typesQuery = useQuery({ queryKey: ['section-types'], queryFn: getSectionTypes });
  const officesQuery = useQuery({
    queryKey: ['offices'],
    queryFn: listOffices,
    enabled: pageQuery.data?.page_key === 'contact' && hasPermission(permissions, 'offices', 'view'),
  });

  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [conflict, setConflict] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const page = pageQuery.data;
  const types = typesQuery.data?.items ?? [];
  const anyDirty = Object.values(dirty).some(Boolean);

  const onDirtyChange = useCallback((sectionId: string, value: boolean) => {
    setDirty((current) => (current[sectionId] === value ? current : { ...current, [sectionId]: value }));
  }, []);

  useEffect(() => {
    if (!anyDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [anyDirty]);

  const applyPage = (updated: AdminPageDetail) => {
    queryClient.setQueryData(['page', id], updated);
    void queryClient.invalidateQueries({ queryKey: ['pages'] });
  };

  const fail = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        setConflict(true);
        return;
      }
      setActionError(error.problem.detail ?? t('pages.edit.actionError'));
      return;
    }
    setActionError(t('pages.edit.actionError'));
  };

  const canEdit = (contentLang?: ContentLang) =>
    hasPermission(permissions, 'pages', 'edit', contentLang);
  const isAdmin = (user?.roles ?? []).some((role) => role === 'admin' || role === 'super_admin');
  const canDelete = hasPermission(permissions, 'pages', 'delete') &&
    (page?.status !== 'published' || isAdmin);

  const move = async (sectionId: string, position: number) => {
    if (!page) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await patchSection(sectionId, { revision: page.revision, position });
      applyPage(result.page);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (sectionId: string, isActive: boolean) => {
    if (!page) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await patchSection(sectionId, { revision: page.revision, is_active: isActive });
      applyPage(result.page);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const toggleNav = async (next: boolean) => {
    if (!page) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await patchPage(page.id, {
        revision: page.revision,
        is_in_nav: next,
        nav_position: next ? (page.nav_position ?? 1) : null,
      });
      applyPage(updated);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const submitAdd = async () => {
    if (!page || !addType) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await createSection(page.id, { revision: page.revision, section_type: addType });
      applyPage(result.page);
      setAddOpen(false);
      setAddType('');
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const submitDelete = async () => {
    if (!page || !deleteId) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await removeSection(deleteId, page.revision);
      applyPage(updated);
      setDeleteId(null);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const reload = () => {
    setConflict(false);
    setDirty({});
    void pageQuery.refetch();
  };

  if (pageQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (pageQuery.isError || !page) {
    const notFound = pageQuery.error instanceof ApiError && pageQuery.error.status === 404;
    return (
      <div className="space-y-3">
        <Alert tone="danger" title={notFound ? t('pages.edit.notFound') : t('pages.edit.loadError')} />
        <Button variant="secondary" size="sm" onClick={() => void pageQuery.refetch()}>
          {t('common.retry')}
        </Button>
        <div>
          <Link to="/pages" className="text-sm text-turquoise-700 underline underline-offset-4">
            {t('pages.edit.back')}
          </Link>
        </div>
      </div>
    );
  }

  const ordered = [...page.sections].sort((a, b) => a.position - b.position);
  const editableTypes = types.filter((type) => type.editable);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (anyDirty ? setLeaveOpen(true) : navigate('/pages'))}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('pages.edit.back')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          aria-pressed={previewOpen}
          onClick={() => setPreviewOpen((open) => !open)}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          {previewOpen ? t('pages.preview.hide') : t('pages.preview.show')}
        </Button>
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl text-ink">{page.title[lang] || page.page_key}</h1>
          <StatusPill tone={STATUS_TONE[page.status]}>{t(PAGE_STATUS_LABEL[page.status])}</StatusPill>
          <span className="text-xs text-muted">
            {page.page_key} · {page.template} · {t('pages.edit.revision', { revision: page.revision })}
          </span>
        </div>
        <p className="text-sm text-muted">
          {page.slug[lang] ? `/${page.slug[lang]}` : t('pages.edit.noSlug')}
        </p>
      </header>

      {page.banners_pending ? <Alert tone="warning" title={t('pages.edit.bannersPending')} /> : null}
      {conflict ? (
        <Alert tone="danger" title={t('pages.edit.conflict')}>
          <Button variant="secondary" size="sm" className="mt-2" onClick={reload}>
            {t('pages.edit.reload')}
          </Button>
        </Alert>
      ) : null}
      {actionError ? <Alert tone="danger" title={actionError} /> : null}
      {anyDirty ? <Alert tone="warning" title={t('pages.edit.unsaved')} /> : null}

      <WorkflowBar page={page} onUpdated={applyPage} onConflict={() => setConflict(true)} />

      <section className="rounded-card border border-line bg-surface p-3">
        <h2 className="mb-2 text-sm font-semibold text-ink">{t('pages.edit.navTitle')}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-turquoise-600"
              checked={page.is_in_nav}
              disabled={!canEdit('fr') && !canEdit('en')}
              onChange={(event) => void toggleNav(event.target.checked)}
            />
            {t('pages.edit.inNav')}
          </label>
          {page.is_in_nav ? (
            <Field id="nav-position" label={t('pages.edit.navPosition')} className="w-28">
              <Input
                id="nav-position"
                type="number"
                min={0}
                value={page.nav_position ?? 1}
                disabled={!canEdit('fr') && !canEdit('en')}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (!Number.isFinite(value) || value === page.nav_position) return;
                  void patchPage(page.id, { revision: page.revision, nav_position: value })
                    .then(applyPage)
                    .catch(fail);
                }}
              />
            </Field>
          ) : null}
        </div>
      </section>

      <PagePanel
        page={page}
        canEditContent={canEdit}
        canEditSeo={(contentLang) => hasPermission(permissions, 'seo', 'edit', contentLang)}
        onSaved={applyPage}
        onDirtyChange={onDirtyChange}
        onConflict={() => setConflict(true)}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">
              {t('pages.edit.sectionsTitle', { count: ordered.length })}
            </h2>
            <Button
              size="sm"
              disabled={!canEdit('fr') && !canEdit('en')}
              onClick={() => {
                setAddOpen(true);
                setAddType(editableTypes[0]?.code ?? '');
              }}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t('pages.edit.addSection')}
            </Button>
          </div>

          {ordered.length === 0 ? (
            <EmptyState
              icon={Plus}
              title={t('pages.edit.noSections')}
              description={t('pages.edit.noSectionsHint')}
            />
          ) : (
            <ul className="space-y-3">
              {ordered.map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  type={types.find((type) => type.code === section.section_type)}
                  index={index}
                  total={ordered.length}
                  revision={page.revision}
                  canEdit={canEdit}
                  canToggle={(canEdit('fr') || canEdit('en')) && !busy}
                  canDelete={Boolean(canDelete) && !busy}
                  onSaved={applyPage}
                  onDirtyChange={onDirtyChange}
                  onConflict={() => setConflict(true)}
                  onMove={(direction) =>
                    void move(section.id, section.position + direction)
                  }
                  onDelete={() => setDeleteId(section.id)}
                  onToggleActive={() => void toggleActive(section.id, !section.is_active)}
                  onDragStart={() => setDragIndex(index)}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index) return;
                    void move(section.id, ordered[dragIndex].position);
                    setDragIndex(null);
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        {previewOpen ? <PagePreview page={page} types={types} lang={lang} offices={officesQuery.data?.items} /> : null}
      </div>

      <ConfirmDialog
        open={leaveOpen}
        title={t('pages.edit.leaveTitle')}
        description={t('pages.edit.leaveDescription')}
        confirmLabel={t('pages.edit.leaveConfirm')}
        onConfirm={() => {
          setLeaveOpen(false);
          navigate('/pages');
        }}
        onClose={() => setLeaveOpen(false)}
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('pages.edit.addTitle')}
        description={t('pages.edit.addDescription')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={busy}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void submitAdd()} isLoading={busy} disabled={!addType}>
              {t('pages.edit.addConfirm')}
            </Button>
          </>
        }
      >
        <Field id="add-section-type" label={t('pages.edit.addType')} required>
          <Select
            id="add-section-type"
            value={addType}
            onChange={(event) => setAddType(event.target.value)}
          >
            {editableTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {t(type.labelKey)}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('pages.edit.deleteTitle')}
        description={t('pages.edit.deleteDescription')}
        confirmLabel={t('pages.edit.deleteConfirm')}
        tone="danger"
        isLoading={busy}
        onConfirm={() => void submitDelete()}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
