import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Skeleton,
  StatusPill,
  Table,
  TableContainer,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Textarea,
} from '@/components/ui';
import { useToast } from '@/components/ui/useToast';
import {
  createOffice,
  deleteOffice,
  listOffices,
  updateOffice,
} from '@/services/api/endpoints/offices';
import { ApiError } from '@/services/api/problem';
import type { AdminOffice, ContentLang, OfficeWrite } from '@/services/api/types';
import { hasAnyPermission } from '@/services/auth/permissions';
import { useAuth } from '@/services/auth/useAuth';

const LANGS: ContentLang[] = ['fr', 'en'];

interface FormState {
  code: string;
  position: string;
  is_headquarters: boolean;
  is_active: boolean;
  phone_fixed: string;
  phone_mobile: string;
  email: string;
  map_url: string;
  translations: Record<ContentLang, { name: string; city: string; address: string }>;
}

const EMPTY_FORM: FormState = {
  code: '',
  position: '',
  is_headquarters: false,
  is_active: true,
  phone_fixed: '',
  phone_mobile: '',
  email: '',
  map_url: '',
  translations: {
    fr: { name: '', city: '', address: '' },
    en: { name: '', city: '', address: '' },
  },
};

function toForm(office: AdminOffice): FormState {
  return {
    code: office.code,
    position: String(office.position),
    is_headquarters: office.is_headquarters,
    is_active: office.is_active,
    phone_fixed: office.phone_fixed ?? '',
    phone_mobile: office.phone_mobile ?? '',
    email: office.email ?? '',
    map_url: office.map_url ?? '',
    translations: {
      fr: {
        name: office.translations.fr.name,
        city: office.translations.fr.city,
        address: office.translations.fr.address_lines.join('\n'),
      },
      en: {
        name: office.translations.en.name,
        city: office.translations.en.city,
        address: office.translations.en.address_lines.join('\n'),
      },
    },
  };
}

function toPayload(form: FormState): OfficeWrite {
  const payload: OfficeWrite = {
    code: form.code.trim().toUpperCase(),
    is_headquarters: form.is_headquarters,
    is_active: form.is_active,
    phone_fixed: form.phone_fixed.trim() || null,
    phone_mobile: form.phone_mobile.trim() || null,
    email: form.email.trim() || null,
    map_url: form.map_url.trim() || null,
    translations: { fr: { name: '', city: '', address_lines: [] }, en: { name: '', city: '', address_lines: [] } },
  };
  const position = Number.parseInt(form.position, 10);
  if (Number.isInteger(position) && position > 0) payload.position = position;
  for (const lang of LANGS) {
    payload.translations[lang] = {
      name: form.translations[lang].name.trim(),
      city: form.translations[lang].city.trim(),
      address_lines: form.translations[lang].address
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }
  return payload;
}

/** Bureaux (`/bureaux`) : liste ordonnée, fiche bilingue et suppression protégée. */
export default function OfficesPage() {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const canCreate = hasAnyPermission(permissions, 'offices', 'create');
  const canEdit = hasAnyPermission(permissions, 'offices', 'edit');
  const canDelete = hasAnyPermission(permissions, 'offices', 'delete');

  const [editing, setEditing] = useState<AdminOffice | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminOffice | null>(null);

  const list = useQuery({ queryKey: ['offices'], queryFn: listOffices });
  const offices = useMemo(() => list.data?.items ?? [], [list.data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['offices'] });

  const save = useMutation({
    mutationFn: (input: { id: string | null; payload: OfficeWrite }) =>
      input.id ? updateOffice(input.id, input.payload) : createOffice(input.payload),
    onSuccess: () => {
      setFormOpen(false);
      setEditing(null);
      setFieldError(null);
      void invalidate();
      toast.push({ tone: 'success', title: t('offices.form.saved') });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setFieldError(error.problem.detail ?? t('offices.form.error'));
        return;
      }
      setFieldError(t('offices.form.error'));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteOffice(id),
    onSuccess: () => {
      setToDelete(null);
      void invalidate();
      toast.push({ tone: 'success', title: t('offices.delete.done') });
    },
    onError: (error) => {
      setToDelete(null);
      const detail =
        error instanceof ApiError && error.problem.detail ? error.problem.detail : t('offices.delete.error');
      toast.push({ tone: 'error', title: detail });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldError(null);
    setFormOpen(true);
  };

  const openEdit = (office: AdminOffice) => {
    setEditing(office);
    setForm(toForm(office));
    setFieldError(null);
    setFormOpen(true);
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateTranslation = (lang: ContentLang, key: 'name' | 'city' | 'address', value: string) => {
    setForm((current) => ({
      ...current,
      translations: { ...current.translations, [lang]: { ...current.translations[lang], [key]: value } },
    }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('offices.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{t('offices.subtitle')}</p>
        </div>
        {canCreate ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('offices.create')}
          </Button>
        ) : null}
      </header>

      {list.isError ? (
        <Alert tone="danger" title={t('offices.loadError')}>
          {t('common.retryHint')}
        </Alert>
      ) : null}

      {list.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : offices.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t('offices.empty.title')}
          description={t('offices.empty.description')}
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TR>
                <TH>{t('offices.columns.office')}</TH>
                <TH>{t('offices.columns.contact')}</TH>
                <TH>{t('offices.columns.position')}</TH>
                <TH>{t('offices.columns.status')}</TH>
                <TH className="text-right">{t('common.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {offices.map((office) => (
                <TR key={office.id}>
                  <TD>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-ink">
                        {office.translations.fr.name || office.code}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {office.code} · {office.translations.fr.city}
                      </span>
                      {office.translations.fr.address_lines[0] ? (
                        <span className="text-xs text-ink-muted">
                          {office.translations.fr.address_lines[0]}
                        </span>
                      ) : null}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-col gap-1 text-sm">
                      <span>{office.phone_fixed ?? office.phone_mobile ?? t('offices.noPhone')}</span>
                      <span className="text-xs text-ink-muted">{office.email ?? t('offices.noEmail')}</span>
                    </div>
                  </TD>
                  <TD>{office.position}</TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={office.is_active ? 'success' : 'neutral'}>
                        {office.is_active ? t('offices.active') : t('offices.inactive')}
                      </StatusPill>
                      {office.is_headquarters ? <Badge tone="info">{t('offices.headquarters')}</Badge> : null}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canEdit}
                        onClick={() => openEdit(office)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canDelete}
                        onClick={() => setToDelete(office)}
                        aria-label={t('offices.delete.open', { name: office.translations.fr.name })}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('offices.form.editTitle') : t('offices.form.createTitle')}
        description={t('offices.form.description')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button isLoading={save.isPending} onClick={() => save.mutate({ id: editing?.id ?? null, payload: toPayload(form) })}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editing?.id ?? null, payload: toPayload(form) });
          }}
        >
          {fieldError ? <Alert tone="danger" title={fieldError} /> : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="office-code" label={t('offices.fields.code')} required hint={t('offices.fields.codeHint')}>
              <Input
                id="office-code"
                value={form.code}
                maxLength={8}
                required
                onChange={(event) => update('code', event.target.value.toUpperCase())}
              />
            </Field>
            <Field id="office-position" label={t('offices.fields.position')} hint={t('offices.fields.positionHint')}>
              <Input
                id="office-position"
                type="number"
                min={1}
                value={form.position}
                onChange={(event) => update('position', event.target.value)}
              />
            </Field>
            <Field id="office-email" label={t('offices.fields.email')}>
              <Input
                id="office-email"
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="office-phone-fixed" label={t('offices.fields.phoneFixed')}>
              <Input
                id="office-phone-fixed"
                value={form.phone_fixed}
                onChange={(event) => update('phone_fixed', event.target.value)}
              />
            </Field>
            <Field id="office-phone-mobile" label={t('offices.fields.phoneMobile')}>
              <Input
                id="office-phone-mobile"
                value={form.phone_mobile}
                onChange={(event) => update('phone_mobile', event.target.value)}
              />
            </Field>
          </div>

          <Field id="office-map" label={t('offices.fields.mapUrl')} hint={t('offices.fields.mapUrlHint')}>
            <Input
              id="office-map"
              value={form.map_url}
              placeholder="https://"
              onChange={(event) => update('map_url', event.target.value)}
            />
          </Field>

          <fieldset className="flex flex-wrap gap-6">
            <legend className="sr-only">{t('offices.fields.flags')}</legend>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.is_headquarters}
                onChange={(event) => update('is_headquarters', event.target.checked)}
              />
              {t('offices.fields.headquarters')}
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => update('is_active', event.target.checked)}
              />
              {t('offices.fields.active')}
            </label>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            {LANGS.map((lang) => (
              <section
                key={lang}
                className="space-y-3 rounded-card border border-line p-4"
                aria-label={t(`offices.lang.${lang}`)}
              >
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  {t(`offices.lang.${lang}`)}
                </h2>
                <Field id={`office-name-${lang}`} label={t('offices.fields.name')} required={lang === 'fr'}>
                  <Input
                    id={`office-name-${lang}`}
                    value={form.translations[lang].name}
                    onChange={(event) => updateTranslation(lang, 'name', event.target.value)}
                  />
                </Field>
                <Field id={`office-city-${lang}`} label={t('offices.fields.city')} required={lang === 'fr'}>
                  <Input
                    id={`office-city-${lang}`}
                    value={form.translations[lang].city}
                    onChange={(event) => updateTranslation(lang, 'city', event.target.value)}
                  />
                </Field>
                <Field
                  id={`office-address-${lang}`}
                  label={t('offices.fields.address')}
                  hint={t('offices.fields.addressHint')}
                >
                  <Textarea
                    id={`office-address-${lang}`}
                    rows={3}
                    value={form.translations[lang].address}
                    onChange={(event) => updateTranslation(lang, 'address', event.target.value)}
                  />
                </Field>
              </section>
            ))}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title={t('offices.delete.title')}
        description={t('offices.delete.description', { name: toDelete?.translations.fr.name ?? '' })}
        confirmLabel={t('common.delete')}
        tone="danger"
        isLoading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
